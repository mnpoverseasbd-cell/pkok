import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import {
  fairBalloon,
  balloonMultAt,
  balloonNetMult,
  BALLOON_MAX_PUMPS,
  BALLOON_POP_CHANCE,
  BALLOON_STEP,
} from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust, sfxTick } from "@/lib/sound";

export const Route = createFileRoute("/games/balloon")({
  head: () => ({ meta: [
    { title: "Balloon · Cash or Crash — Asik Game" },
    { name: "description", content: "প্রতিটি পাম্পে বেলুন বড় হবে এবং মাল্টিপ্লায়ার বাড়বে। ফাটার আগে ক্যাশ-আউট করুন — ফাটলে হারলেন!" },
    { property: "og:title", content: "Balloon · Cash or Crash — Asik Game" },
    { property: "og:description", content: "Inflate the balloon. Each pump multiplies your payout by 1.14×. Cash out before it pops." },
  ]}),
  component: BalloonGame,
});

type State =
  | { phase: "idle" }
  | { phase: "playing"; pumps: number; floats: number[]; popAt: number; popMult: number; bet: number }
  | { phase: "popped"; pumps: number; popAt: number; popMult: number; bet: number }
  | { phase: "cashed"; pumps: number; payout: number; grossMult: number; bet: number };

function BalloonGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("balloon");
  const { data: cfg } = useGameConfig("balloon");
  const pf = useProvablyFair("balloon");
  const edge = cfg?.house_edge ?? 0.05;

  const [bet, setBet] = useState(20);
  const [state, setState] = useState<State>({ phase: "idle" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const currentMult = useMemo(() => {
    if (state.phase === "playing") return balloonMultAt(state.pumps);
    if (state.phase === "popped") return balloonMultAt(state.pumps);
    if (state.phase === "cashed") return state.grossMult;
    return 1;
  }, [state]);

  const netCashout = useMemo(() => balloonNetMult(currentMult, edge), [currentMult, edge]);

  const start = useCallback(async () => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg("");
    const r = await fairBalloon(pf.serverSeed, pf.clientSeed, pf.nonce, BALLOON_MAX_PUMPS);
    setState({ phase: "playing", pumps: 0, floats: r.floats, popAt: r.popAt, popMult: r.popMult, bet });
    setBusy(false);
  }, [busy, bet, placeBet, pf]);

  const pump = useCallback(() => {
    if (state.phase !== "playing" || busy) return;
    const next = state.pumps + 1;
    // Did this pump pop? popAt is 0-indexed float position; if popAt === state.pumps this pump pops.
    const popped = state.popAt >= 0 && state.popAt === state.pumps;
    if (popped) {
      try { sfxBust(); } catch {}
      const pnl = -state.bet;
      record({ pnl, multiplier: 0 });
      pushMultiplierHistory("balloon", 0);
      recordMyBet({ game: "balloon", bet: state.bet, multiplier: 0, payout: 0 });
      pf.consume(`balloon POP@pump${next} popMult=${state.popMult.toFixed(2)}x bet=${state.bet}`);
      setState({ phase: "popped", pumps: next, popAt: state.popAt, popMult: state.popMult, bet: state.bet });
      setMsg(`💥 বেলুন ফেটে গেছে পাম্প ${next}-এ! লস ${state.bet}`);
      return;
    }
    try { sfxTick(); } catch {}
    setState({ ...state, pumps: next });
    if (next >= BALLOON_MAX_PUMPS) {
      // Auto-cashout at max.
      const gross = balloonMultAt(next);
      const netMult = balloonNetMult(gross, edge);
      const payout = Math.floor(state.bet * netMult);
      credit(payout);
      const pnl = payout - state.bet;
      try { sfxWin(netMult); } catch {}
      record({ pnl, multiplier: netMult });
      pushMultiplierHistory("balloon", netMult);
      recordMyBet({ game: "balloon", bet: state.bet, multiplier: netMult, payout });
      pf.consume(`balloon MAX pumps=${next} gross=${gross.toFixed(2)}x net=${netMult.toFixed(2)}x`);
      setState({ phase: "cashed", pumps: next, payout, grossMult: gross, bet: state.bet });
      setMsg(`🏆 MAX! ${netMult.toFixed(2)}× · +${pnl}`);
    }
  }, [state, busy, edge, credit, record, pf]);

  const cashout = useCallback(() => {
    if (state.phase !== "playing" || busy || state.pumps === 0) return;
    const gross = balloonMultAt(state.pumps);
    const netMult = balloonNetMult(gross, edge);
    const payout = Math.floor(state.bet * netMult);
    credit(payout);
    const pnl = payout - state.bet;
    try { sfxWin(netMult); } catch {}
    record({ pnl, multiplier: netMult });
    pushMultiplierHistory("balloon", netMult);
    recordMyBet({ game: "balloon", bet: state.bet, multiplier: netMult, payout });
    pf.consume(`balloon CASHOUT pumps=${state.pumps} net=${netMult.toFixed(2)}x`);
    setState({ phase: "cashed", pumps: state.pumps, payout, grossMult: gross, bet: state.bet });
    setMsg(`💰 ক্যাশ-আউট ${netMult.toFixed(2)}× · +${pnl}`);
  }, [state, busy, edge, credit, record, pf]);

  const reset = () => { setState({ phase: "idle" }); setMsg(""); };

  const pumps = state.phase === "playing" || state.phase === "popped" || state.phase === "cashed" ? state.pumps : 0;
  const size = Math.min(320, 90 + pumps * 9);
  const isPopped = state.phase === "popped";
  const isCashed = state.phase === "cashed";
  const isPlaying = state.phase === "playing";
  const hue = Math.max(0, 200 - pumps * 8); // shifts red as it grows

  return (
    <GameShell title="Balloon · Cash or Crash" emoji="🎈" gameKey="balloon">
      <GameFrame>
        <div
          className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-fuchsia-400/30 p-4 min-h-[460px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,120,220,0.18), transparent 55%), radial-gradient(circle at 50% 100%, rgba(80,60,220,0.35), transparent 55%), linear-gradient(180deg, #1a0630 0%, #2a0f4a 55%, #05010f 100%)",
          }}
        >
          <div className="pointer-events-none absolute inset-2 rounded-2xl border border-amber-400/20" />

          <div className="relative z-[2] text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-200/80">Arcade Crash</div>
            <div className="text-2xl font-black text-white">🎈 বেলুন — ক্যাশ অর ক্র্যাশ 🎈</div>
            <div className="mt-1 text-[11px] text-white/60">
              প্রতিটি পাম্প ×{BALLOON_STEP} · প্রতি পাম্পে ফাটার ঝুঁকি {(BALLOON_POP_CHANCE * 100).toFixed(0)}% · ম্যাক্স {BALLOON_MAX_PUMPS} পাম্প
            </div>
          </div>

          {/* Balloon */}
          <div className="relative z-[2] mx-auto grid flex-1 place-items-center">
            <div className="relative flex flex-col items-center">
              <div
                className={`relative transition-all duration-200 ${isPlaying ? "animate-[float_2.4s_ease-in-out_infinite]" : ""}`}
                style={{
                  width: `${size}px`,
                  height: `${size * 1.15}px`,
                  transform: isPopped ? "scale(0.001)" : "scale(1)",
                  opacity: isPopped ? 0 : 1,
                  transition: "transform 220ms ease, opacity 220ms ease, width 220ms ease, height 220ms ease",
                }}
              >
                <div
                  className="absolute inset-0 rounded-[50%] shadow-[0_0_60px_rgba(255,120,220,0.55),inset_-20px_-30px_60px_rgba(0,0,0,0.35),inset_20px_20px_40px_rgba(255,255,255,0.35)]"
                  style={{
                    background: `radial-gradient(ellipse at 35% 30%, hsl(${hue} 90% 75%), hsl(${hue} 90% 45%) 65%, hsl(${hue} 85% 30%))`,
                  }}
                />
                {/* Highlight */}
                <div className="absolute left-[22%] top-[18%] h-[18%] w-[18%] rounded-full bg-white/60 blur-sm" />
                {/* Knot */}
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    top: `${size * 1.13}px`,
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderTop: `10px solid hsl(${hue} 85% 35%)`,
                  }}
                />
                {/* Multiplier badge on balloon */}
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-3xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                    {balloonMultAt(pumps).toFixed(2)}×
                  </div>
                </div>
              </div>

              {/* String */}
              {!isPopped && (
                <div className="h-16 w-[1.5px] bg-gradient-to-b from-white/50 to-transparent" />
              )}

              {/* Pop / Cashed overlay */}
              {isPopped && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-6xl animate-ping">💥</div>
                  <div className="absolute text-lg font-black text-rose-300">POP @ {balloonMultAt(pumps).toFixed(2)}×</div>
                </div>
              )}
              {isCashed && (
                <div className="mt-2 rounded-full border border-emerald-300/50 bg-emerald-500/25 px-3 py-1 text-sm font-black text-emerald-100 shadow-[0_0_16px_rgba(80,255,180,0.55)]">
                  ✅ ক্যাশ-আউট {(state.grossMult * (1 - edge)).toFixed(2)}× · +{state.payout - state.bet}
                </div>
              )}
            </div>
          </div>

          {/* Live stats pills */}
          <div className="relative z-[2] mx-auto flex flex-wrap items-center justify-center gap-2 text-[11px] font-black">
            <div className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-white/80">
              Pumps <span className="text-white">{pumps}/{BALLOON_MAX_PUMPS}</span>
            </div>
            <div className="rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-1 text-amber-100">
              Current ×{balloonMultAt(pumps).toFixed(2)}
            </div>
            <div className="rounded-full border border-emerald-300/40 bg-emerald-500/15 px-3 py-1 text-emerald-100">
              Cashout ×{netCashout.toFixed(2)}
            </div>
            {isPlaying && pumps > 0 && (
              <div className="rounded-full border border-emerald-300/50 bg-emerald-500/25 px-3 py-1 text-emerald-100">
                Payout {Math.floor(state.bet * netCashout)}
              </div>
            )}
          </div>

          {msg && (
            <div className="relative z-[2] text-center text-base font-black text-[var(--neon-gold)]">
              {msg}
            </div>
          )}
        </div>

        <ControlsPanel>
          <MultDisplay
            label="Current"
            value={`${balloonMultAt(pumps).toFixed(2)}×`}
            sub={<>Cashout ×{netCashout.toFixed(2)} · edge {(edge * 100).toFixed(1)}%</>}
          />
          <BetControls bet={bet} setBet={setBet} disabled={busy || isPlaying} />
          {state.phase === "idle" || state.phase === "cashed" || state.phase === "popped" ? (
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton onClick={state.phase === "idle" ? start : () => { reset(); start(); }} disabled={busy}>
                {busy ? "লোডিং..." : `🎈 নতুন বেলুন (${bet})`}
              </PrimaryButton>
              <button
                onClick={reset}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white/80 hover:bg-white/20"
              >
                রিসেট
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton onClick={pump} disabled={busy}>
                ⬆️ পাম্প (×{BALLOON_STEP})
              </PrimaryButton>
              <button
                onClick={cashout}
                disabled={busy || pumps === 0}
                className="rounded-xl border border-emerald-300/50 bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-3 text-sm font-black text-white shadow-[0_0_16px_rgba(80,255,180,0.55)] disabled:opacity-40"
              >
                💰 ক্যাশ-আউট
                <div className="text-[10px] font-black opacity-90">
                  {pumps === 0 ? "প্রথম পাম্প করুন" : `+${Math.floor(state.bet * netCashout) - state.bet}`}
                </div>
              </button>
            </div>
          )}
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="balloon" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />

      {/* Paytable */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">
          Pump ladder · gross ×{BALLOON_STEP} per pump · pop chance {(BALLOON_POP_CHANCE * 100).toFixed(0)}%
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-9">
          {Array.from({ length: 9 }).map((_, i) => {
            const p = (i + 1) * 3; // 3, 6, 9, ... 27
            const g = balloonMultAt(p);
            const n = balloonNetMult(g, edge);
            const survivalPct = Math.pow(1 - BALLOON_POP_CHANCE, p) * 100;
            return (
              <div key={p} className="rounded-lg border border-white/15 bg-white/5 p-2 text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Pump</div>
                <div className="text-lg font-black text-white">{p}</div>
                <div className="text-[11px] font-black text-emerald-300">×{n.toFixed(2)}</div>
                <div className="text-[9px] text-white/60">survive {survivalPct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <ProvablyFairPanel pf={pf} gameKey="balloon" />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </GameShell>
  );
}
