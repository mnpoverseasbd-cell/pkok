import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import {
  fairLudo,
  ludoNetMult,
  LUDO_MAX_ROLLS,
  LUDO_TARGET_SPACES,
  LUDO_STEP_MULT,
  LUDO_SIX_MULT,
  LUDO_FINISH_MULT,
  type LudoRoll,
} from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust, sfxTick } from "@/lib/sound";

export const Route = createFileRoute("/games/ludo")({
  head: () => ({ meta: [
    { title: "Ludo Dash · Race to 57 — Asik Game" },
    { name: "description", content: "লুডু-স্টাইল ডাইস ক্র্যাশ! ৫৭ ঘর পর্যন্ত টোকেন দৌড়ান, প্রতি রোলে মাল্ট বাড়ে, ১ পড়লে সাপে খায় — যেকোনো সময় ক্যাশ-আউট।" },
    { property: "og:title", content: "Ludo Dash · Race to 57 — Asik Game" },
    { property: "og:description", content: "BD-flavoured ludo crash: roll to 57, dodge the snake, cash out anytime." },
  ]}),
  component: LudoGame,
});

const DIE_FACES: Record<number, string> = { 1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };

function dieStyle(die: number, isBust: boolean) {
  if (isBust) return "border-rose-400 bg-rose-600/30 text-rose-100 shadow-[0_0_16px_rgba(255,80,120,0.6)]";
  if (die === 6) return "border-amber-300/80 bg-amber-500/30 text-amber-100 shadow-[0_0_16px_rgba(255,200,80,0.6)]";
  return "border-emerald-300/60 bg-emerald-500/20 text-emerald-100";
}

function LudoGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("ludo");
  const { data: cfg } = useGameConfig("ludo");
  const pf = useProvablyFair("ludo");
  const edge = cfg?.house_edge ?? 0.05;

  const [bet, setBet] = useState(20);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<null | {
    plan: LudoRoll[];   // full pre-computed roll plan
    bustAt: number;     // -1 if none
    finishedAt: number; // -1 if none
    revealed: LudoRoll[];
    gross: number;
    spaces: number;
    idx: number;
    ended: boolean;
  }>(null);
  const [msg, setMsg] = useState("");

  const netMult = useMemo(() => live ? ludoNetMult(live.gross, edge) : 1, [live, edge]);
  const cashoutAmount = live ? Math.floor(bet * netMult) : 0;
  const canRoll = !!live && !live.ended && !busy && live.idx < live.plan.length;
  const canCashout = !!live && !live.ended && live.gross > 1 && !busy;

  const startRace = useCallback(async () => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg("");
    const r = await fairLudo(pf.serverSeed, pf.clientSeed, pf.nonce, LUDO_MAX_ROLLS);
    setLive({
      plan: r.rolls,
      bustAt: r.bustAt,
      finishedAt: r.finishedAt,
      revealed: [],
      gross: 1,
      spaces: 0,
      idx: 0,
      ended: false,
    });
    setBusy(false);
  }, [busy, bet, placeBet, pf]);

  const rollDie = useCallback(async () => {
    if (!live || live.ended || busy) return;
    if (live.idx >= live.plan.length) return;
    setBusy(true);
    const roll = live.plan[live.idx];
    try { sfxTick(); } catch {}
    await new Promise((r) => setTimeout(r, 280));

    if (roll.isBust) {
      const revealed = [...live.revealed, roll];
      setLive({ ...live, revealed, ended: true, idx: live.idx + 1 });
      record({ pnl: -bet, multiplier: 0 });
      pushMultiplierHistory("ludo", 0);
      recordMyBet({ game: "ludo", bet, multiplier: 0, payout: 0 });
      pf.consume(`ludo snake at roll ${live.idx + 1} spaces=${live.spaces}`);
      try { sfxBust(); } catch {}
      setMsg(`🐍 সাপে খেলো! রোল #${live.idx + 1} · লস ${bet}`);
      setBusy(false);
      return;
    }

    const nextGross = +(live.gross * roll.stepMult).toFixed(4);
    const nextSpaces = live.spaces + roll.advance;
    const revealed = [...live.revealed, roll];
    const idx = live.idx + 1;
    const finished = nextSpaces >= LUDO_TARGET_SPACES;

    if (finished) {
      const finalGross = +(nextGross * LUDO_FINISH_MULT).toFixed(4);
      const net = ludoNetMult(finalGross, edge);
      const payout = Math.floor(bet * net);
      credit(payout);
      const pnl = payout - bet;
      record({ pnl, multiplier: net });
      pushMultiplierHistory("ludo", net);
      recordMyBet({ game: "ludo", bet, multiplier: net, payout });
      pf.consume(`ludo finished spaces=${nextSpaces} net=${net}`);
      setLive({ ...live, revealed, gross: finalGross, spaces: nextSpaces, idx, ended: true });
      setMsg(`🏁 ফিনিশ! +${pnl} · ${net.toFixed(2)}× (×${LUDO_FINISH_MULT} finish bonus)`);
      try { sfxWin(net); } catch {}
    } else {
      setLive({ ...live, revealed, gross: nextGross, spaces: nextSpaces, idx });
      if (roll.die === 6) try { sfxWin(nextGross); } catch {}
      const netNow = ludoNetMult(nextGross, edge);
      setMsg(`${roll.die === 6 ? "💥 ছয়!" : `+${roll.advance} ঘর`} · এখন ${netNow.toFixed(2)}×`);
    }
    setBusy(false);
  }, [live, busy, bet, edge, credit, record, pf]);

  const cashout = useCallback(() => {
    if (!live || live.ended || live.gross <= 1) return;
    const net = ludoNetMult(live.gross, edge);
    const payout = Math.floor(bet * net);
    credit(payout);
    const pnl = payout - bet;
    record({ pnl, multiplier: net });
    pushMultiplierHistory("ludo", net);
    recordMyBet({ game: "ludo", bet, multiplier: net, payout });
    pf.consume(`ludo cashout rolls=${live.idx} spaces=${live.spaces} net=${net}`);
    setLive({ ...live, ended: true });
    setMsg(`💰 ক্যাশ-আউট! +${pnl} · ${net.toFixed(2)}× · ${live.spaces}/${LUDO_TARGET_SPACES} ঘর`);
  }, [live, bet, edge, credit, record, pf]);

  const progressPct = live ? Math.min(100, (live.spaces / LUDO_TARGET_SPACES) * 100) : 0;

  return (
    <GameShell title="Ludo Dash · Race to 57" emoji="🎲" gameKey="ludo">
      <GameFrame>
        <div
          className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-fuchsia-400/30 p-4 min-h-[420px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,120,220,0.14), transparent 55%), radial-gradient(circle at 50% 90%, rgba(120,80,255,0.20), transparent 55%), linear-gradient(180deg, #120722 0%, #1a0a3a 55%, #08041a 100%)",
          }}
        >
          {/* Track background stripes */}
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{ background: "repeating-linear-gradient(90deg, transparent 0 40px, rgba(255,255,255,0.05) 40px 41px)" }}
          />

          <div className="relative z-[2] text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-300/90">Race to {LUDO_TARGET_SPACES}</div>
            <div className="text-2xl font-black text-white">🎲 লুডু ড্যাশ 🎲</div>
            <div className="mt-1 text-[11px] text-white/60">
              প্রতি রোলে ২–৫ = ×{LUDO_STEP_MULT.toFixed(2)} · ছয় = ×{LUDO_SIX_MULT.toFixed(2)} · এক = সাপ (বাস্ট) · ফিনিশ বোনাস ×{LUDO_FINISH_MULT.toFixed(2)}
            </div>
          </div>

          {/* Big mult */}
          <div className="relative z-[2] mx-auto flex flex-col items-center">
            <div
              className={`text-6xl font-black leading-none ${
                live?.ended && live.gross <= 1 ? "text-rose-400" : "text-fuchsia-200"
              }`}
              style={{ textShadow: "0 0 24px rgba(255,120,220,0.5)" }}
            >
              {(live ? netMult : ludoNetMult(1, edge)).toFixed(2)}×
            </div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-widest text-white/60">
              {live ? `Payout at cashout: ${cashoutAmount}` : `Bet ${bet} · edge ${(edge * 100).toFixed(1)}%`}
            </div>
          </div>

          {/* Token track */}
          {live && (
            <div className="relative z-[2] mx-auto w-full max-w-[560px]">
              <div className="relative h-8 overflow-hidden rounded-full border border-fuchsia-300/50 bg-black/40">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-fuchsia-500/60 via-purple-500/60 to-amber-400/60 transition-[width] duration-300"
                  style={{ width: `${progressPct}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 text-2xl transition-[left] duration-300"
                  style={{ left: `calc(${progressPct}% - 14px)` }}
                >
                  🔴
                </div>
                <div className="absolute inset-y-0 right-2 flex items-center text-lg">🏁</div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-black text-white/70">
                <span>Spaces {live.spaces}/{LUDO_TARGET_SPACES}</span>
                <span className="text-fuchsia-200">Roll {live.idx}/{LUDO_MAX_ROLLS}</span>
              </div>
            </div>
          )}

          {/* Roll history strip */}
          {live && live.revealed.length > 0 && (
            <div className="relative z-[2] mx-auto grid w-full max-w-[560px] grid-cols-8 gap-1.5">
              {live.revealed.map((r, i) => (
                <div
                  key={i}
                  className={`grid h-11 place-items-center rounded-md border text-2xl font-black ${dieStyle(r.die, r.isBust)}`}
                  title={`Roll ${i + 1}: ${r.die}${r.isBust ? " (snake)" : ` · +${r.advance} · ×${r.stepMult}`}`}
                >
                  {DIE_FACES[r.die]}
                </div>
              ))}
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
            value={`${(live ? netMult : ludoNetMult(1, edge)).toFixed(2)}×`}
            sub={<>Bet {bet} · edge {(edge * 100).toFixed(1)}%</>}
          />
          <BetControls bet={bet} setBet={setBet} disabled={busy || (live !== null && !live.ended)} />
          {!live || live.ended ? (
            <PrimaryButton onClick={startRace} disabled={busy}>
              {busy ? "লোড হচ্ছে..." : `🎲 রেস শুরু (${bet})`}
            </PrimaryButton>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton onClick={rollDie} disabled={!canRoll}>
                🎲 রোল
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
        <MultiplierHistoryStrip gameKey="ludo" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />

      {/* Paytable */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">
          Dice outcomes · per-roll probability
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((d) => {
            const isBust = d === 1;
            const stepMult = isBust ? 0 : d === 6 ? LUDO_SIX_MULT : LUDO_STEP_MULT;
            const label = isBust ? "SNAKE" : d === 6 ? "SIX" : `+${d}`;
            const step = isBust ? "BUST" : `×${stepMult.toFixed(2)}`;
            return (
              <div key={d} className={`rounded-lg border p-2 text-center ${dieStyle(d, isBust)}`}>
                <div className="text-[10px] font-black uppercase tracking-widest">{label}</div>
                <div className="text-2xl font-black">{DIE_FACES[d]}</div>
                <div className="text-[11px] font-black">{step}</div>
                <div className="text-[9px] opacity-70">16.7%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <ProvablyFairPanel pf={pf} gameKey="ludo" />
      </div>
    </GameShell>
  );
}
