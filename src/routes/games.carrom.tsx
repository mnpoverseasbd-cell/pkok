import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import {
  fairCarrom,
  carromNetMult,
  CARROM_MAX_STRIKES,
  CARROM_OUTCOMES,
  type CarromStrike,
} from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust, sfxTick } from "@/lib/sound";

export const Route = createFileRoute("/games/carrom")({
  head: () => ({ meta: [
    { title: "Carrom Strike · Pocket King — Asik Game" },
    { name: "description", content: "ক্যারাম-স্টাইল ক্র্যাশ! প্রতিটা স্ট্রাইকে কয়েন/কুইন/কিং পকেটে ঢুকে মাল্ট বাড়ে, মিস করলে বাস্ট — যেকোনো সময় ক্যাশ-আউট।" },
    { property: "og:title", content: "Carrom Strike · Pocket King — Asik Game" },
    { property: "og:description", content: "BD-loved carrom crash: pocket coins, queen and the KING for compounding multipliers. Miss = bust." },
  ]}),
  component: CarromGame,
});

function outcomeStyle(idx: number, isBust: boolean) {
  if (isBust) return "border-rose-400 bg-rose-600/30 text-rose-100 shadow-[0_0_16px_rgba(255,80,120,0.6)]";
  if (idx === 4) return "border-amber-300/80 bg-amber-500/30 text-amber-100 shadow-[0_0_20px_rgba(255,200,80,0.7)]";
  if (idx === 3) return "border-rose-300/70 bg-rose-500/25 text-rose-100 shadow-[0_0_16px_rgba(255,120,150,0.5)]";
  if (idx === 2) return "border-slate-300/60 bg-slate-800/60 text-slate-100";
  return "border-white/50 bg-white/15 text-white";
}

function CarromGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("carrom");
  const { data: cfg } = useGameConfig("carrom");
  const pf = useProvablyFair("carrom");
  const edge = cfg?.house_edge ?? 0.05;

  const [bet, setBet] = useState(20);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<null | {
    plan: CarromStrike[];
    bustAt: number;
    revealed: CarromStrike[];
    gross: number;
    idx: number;
    ended: boolean;
  }>(null);
  const [msg, setMsg] = useState("");

  const netMult = useMemo(() => live ? carromNetMult(live.gross, edge) : 1, [live, edge]);
  const cashoutAmount = live ? Math.floor(bet * netMult) : 0;
  const canStrike = !!live && !live.ended && !busy && live.idx < live.plan.length;
  const canCashout = !!live && !live.ended && live.gross > 1 && !busy;

  const startRound = useCallback(async () => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg("");
    const r = await fairCarrom(pf.serverSeed, pf.clientSeed, pf.nonce, CARROM_MAX_STRIKES);
    setLive({
      plan: r.strikes,
      bustAt: r.bustAt,
      revealed: [],
      gross: 1,
      idx: 0,
      ended: false,
    });
    setBusy(false);
  }, [busy, bet, placeBet, pf]);

  const strike = useCallback(async () => {
    if (!live || live.ended || busy) return;
    if (live.idx >= live.plan.length) return;
    setBusy(true);
    const s = live.plan[live.idx];
    try { sfxTick(); } catch {}
    await new Promise((r) => setTimeout(r, 340));

    if (s.isBust) {
      const revealed = [...live.revealed, s];
      setLive({ ...live, revealed, ended: true, idx: live.idx + 1 });
      record({ pnl: -bet, multiplier: 0 });
      pushMultiplierHistory("carrom", 0);
      recordMyBet({ game: "carrom", bet, multiplier: 0, payout: 0 });
      pf.consume(`carrom miss at strike ${live.idx + 1}`);
      try { sfxBust(); } catch {}
      setMsg(`❌ মিস! স্ট্রাইক #${live.idx + 1} · লস ${bet}`);
      setBusy(false);
      return;
    }

    const nextGross = +(live.gross * s.mult).toFixed(4);
    const revealed = [...live.revealed, s];
    const idx = live.idx + 1;
    const o = CARROM_OUTCOMES[s.outcomeIndex];

    if (idx >= live.plan.length) {
      // Ran the table — auto-settle at current gross.
      const net = carromNetMult(nextGross, edge);
      const payout = Math.floor(bet * net);
      credit(payout);
      const pnl = payout - bet;
      record({ pnl, multiplier: net });
      pushMultiplierHistory("carrom", net);
      recordMyBet({ game: "carrom", bet, multiplier: net, payout });
      pf.consume(`carrom cleared all ${idx} strikes net=${net}`);
      setLive({ ...live, revealed, gross: nextGross, idx, ended: true });
      setMsg(`🏆 বোর্ড ক্লিয়ার! +${pnl} · ${net.toFixed(2)}×`);
      try { sfxWin(net); } catch {}
    } else {
      setLive({ ...live, revealed, gross: nextGross, idx });
      if (s.outcomeIndex >= 3) try { sfxWin(nextGross); } catch {}
      const netNow = carromNetMult(nextGross, edge);
      setMsg(`${o.emoji} ${o.label} · এখন ${netNow.toFixed(2)}×`);
    }
    setBusy(false);
  }, [live, busy, bet, edge, credit, record, pf]);

  const cashout = useCallback(() => {
    if (!live || live.ended || live.gross <= 1) return;
    const net = carromNetMult(live.gross, edge);
    const payout = Math.floor(bet * net);
    credit(payout);
    const pnl = payout - bet;
    record({ pnl, multiplier: net });
    pushMultiplierHistory("carrom", net);
    recordMyBet({ game: "carrom", bet, multiplier: net, payout });
    pf.consume(`carrom cashout strikes=${live.idx} net=${net}`);
    setLive({ ...live, ended: true });
    setMsg(`💰 ক্যাশ-আউট! +${pnl} · ${net.toFixed(2)}× · ${live.idx} স্ট্রাইক`);
  }, [live, bet, edge, credit, record, pf]);

  return (
    <GameShell title="Carrom Strike · Pocket King" emoji="🎯" gameKey="carrom">
      <GameFrame>
        <div
          className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-amber-400/30 p-4 min-h-[420px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,200,120,0.16), transparent 55%), radial-gradient(circle at 50% 90%, rgba(180,90,40,0.28), transparent 55%), linear-gradient(180deg, #2a1508 0%, #3a1e0a 55%, #150a04 100%)",
          }}
        >
          {/* Wood grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{ background: "repeating-linear-gradient(90deg, transparent 0 60px, rgba(255,200,150,0.06) 60px 61px)" }}
          />

          <div className="relative z-[2] text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300/90">Pocket King</div>
            <div className="text-2xl font-black text-white">🎯 ক্যারাম স্ট্রাইক 🎯</div>
            <div className="mt-1 text-[11px] text-white/60">
              পকেট = মাল্ট বাড়ে · মিস = বাস্ট · সর্বোচ্চ {CARROM_MAX_STRIKES} স্ট্রাইক · যেকোনো সময় ক্যাশ-আউট
            </div>
          </div>

          {/* Big mult */}
          <div className="relative z-[2] mx-auto flex flex-col items-center">
            <div
              className={`text-6xl font-black leading-none ${
                live?.ended && live.gross <= 1 ? "text-rose-400" : "text-amber-200"
              }`}
              style={{ textShadow: "0 0 24px rgba(255,200,80,0.55)" }}
            >
              {(live ? netMult : carromNetMult(1, edge)).toFixed(2)}×
            </div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-widest text-white/60">
              {live ? `Payout at cashout: ${cashoutAmount}` : `Bet ${bet} · edge ${(edge * 100).toFixed(1)}%`}
            </div>
          </div>

          {/* Carrom board with pockets */}
          <div className="relative z-[2] mx-auto">
            <div
              className="relative grid h-40 w-40 place-items-center rounded-2xl border-4 border-amber-700/70 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]"
              style={{ background: "radial-gradient(circle at 50% 50%, #6b3a12 0%, #3a1d08 100%)" }}
            >
              {/* Four pockets */}
              <div className="absolute -left-2 -top-2 h-6 w-6 rounded-full bg-black shadow-[inset_0_0_6px_rgba(255,255,255,0.2)]" />
              <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-black shadow-[inset_0_0_6px_rgba(255,255,255,0.2)]" />
              <div className="absolute -left-2 -bottom-2 h-6 w-6 rounded-full bg-black shadow-[inset_0_0_6px_rgba(255,255,255,0.2)]" />
              <div className="absolute -right-2 -bottom-2 h-6 w-6 rounded-full bg-black shadow-[inset_0_0_6px_rgba(255,255,255,0.2)]" />
              {/* Center circle */}
              <div className="h-16 w-16 rounded-full border-2 border-amber-400/60 shadow-[0_0_18px_rgba(255,200,80,0.4)]" />
              <div className="absolute text-4xl">
                {live && live.revealed.length > 0 ? CARROM_OUTCOMES[live.revealed[live.revealed.length - 1].outcomeIndex].emoji : "🎯"}
              </div>
            </div>
          </div>

          {/* Strike history strip */}
          {live && live.revealed.length > 0 && (
            <div className="relative z-[2] mx-auto grid w-full max-w-[560px] grid-cols-8 gap-1.5">
              {live.revealed.map((s, i) => (
                <div
                  key={i}
                  className={`grid h-11 place-items-center rounded-md border text-xl font-black ${outcomeStyle(s.outcomeIndex, s.isBust)}`}
                  title={`Strike ${i + 1}: ${CARROM_OUTCOMES[s.outcomeIndex].label}${s.isBust ? "" : ` ×${s.mult}`}`}
                >
                  {CARROM_OUTCOMES[s.outcomeIndex].emoji}
                </div>
              ))}
            </div>
          )}

          {live && (
            <div className="relative z-[2] mx-auto text-[11px] font-black uppercase tracking-widest text-white/70">
              Strikes {live.idx}/{live.plan.length}
            </div>
          )}

          {msg && (
            <div className="relative z-[2] text-center text-base font-black text-[var(--neon-gold)]">
              {msg}
            </div>
          )}
        </div>

        <ControlsPanel>
          <MultDisplay
            label={live && !live.ended ? "Cashout mult" : "Start mult"}
            value={`${(live ? netMult : carromNetMult(1, edge)).toFixed(2)}×`}
            sub={<>Bet {bet} · edge {(edge * 100).toFixed(1)}%</>}
          />
          <BetControls bet={bet} setBet={setBet} disabled={busy || (live !== null && !live.ended)} />
          {!live || live.ended ? (
            <PrimaryButton onClick={startRound} disabled={busy}>
              {busy ? "লোড হচ্ছে..." : `🎯 স্ট্রাইক শুরু (${bet})`}
            </PrimaryButton>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton onClick={strike} disabled={!canStrike}>
                🎯 স্ট্রাইক
              </PrimaryButton>
              <button
                onClick={cashout}
                disabled={!canCashout}
                className="rounded-lg border border-amber-300/60 bg-gradient-to-b from-amber-400/25 to-amber-600/25 px-4 py-3 text-sm font-black text-amber-100 shadow-[0_0_18px_rgba(255,200,80,0.35)] transition hover:brightness-110 disabled:opacity-40"
              >
                💰 ক্যাশ-আউট ({cashoutAmount})
              </button>
            </div>
          )}
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="carrom" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />

      {/* Paytable */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">
          Per-strike outcomes · probability
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {CARROM_OUTCOMES.map((o, i) => {
            const prev = i === 0 ? 0 : CARROM_OUTCOMES[i - 1].cdf;
            const pct = ((o.cdf - prev) * 100).toFixed(1);
            return (
              <div key={o.key} className={`rounded-lg border p-2 text-center ${outcomeStyle(i, o.isBust)}`}>
                <div className="text-[10px] font-black uppercase tracking-widest">{o.label}</div>
                <div className="text-2xl font-black">{o.emoji}</div>
                <div className="text-[11px] font-black">{o.isBust ? "BUST" : `×${o.mult.toFixed(2)}`}</div>
                <div className="text-[9px] opacity-70">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <ProvablyFairPanel pf={pf} gameKey="carrom" />
      </div>
    </GameShell>
  );
}
