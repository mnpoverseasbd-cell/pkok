import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import {
  fairCricket,
  cricketNetMult,
  CRICKET_OUTCOMES,
  CRICKET_MAX_BALLS,
  CRICKET_RUN_GROWTH,
} from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust, sfxTick } from "@/lib/sound";

export const Route = createFileRoute("/games/cricket")({
  head: () => ({ meta: [
    { title: "Cricket Star · Six-Over Chase — Asik Game" },
    { name: "description", content: "৬ ওভারের ক্র্যাশ! প্রতি বলে রান বাড়ায় মাল্টিপ্লায়ার, উইকেট মানেই বাস্ট। যেকোনো বল-এ ক্যাশ-আউট করুন।" },
    { property: "og:title", content: "Cricket Star · Six-Over Chase — Asik Game" },
    { property: "og:description", content: "BD-flavoured cricket crash. Runs grow the multiplier, one wicket ends the innings." },
  ]}),
  component: CricketGame,
});

type BallLog = { outcomeIdx: number; multAfter: number };

function outcomeStyle(key: string) {
  switch (key) {
    case "W": return "border-rose-400 bg-rose-600/30 text-rose-100 shadow-[0_0_16px_rgba(255,80,120,0.6)]";
    case "0": return "border-white/20 bg-black/40 text-white/60";
    case "1": return "border-emerald-300/50 bg-emerald-500/15 text-emerald-100";
    case "2": return "border-emerald-300/60 bg-emerald-500/20 text-emerald-100";
    case "3": return "border-emerald-300/70 bg-emerald-500/25 text-emerald-100";
    case "4": return "border-cyan-300/70 bg-cyan-500/25 text-cyan-100 shadow-[0_0_12px_rgba(80,200,255,0.5)]";
    case "6": return "border-amber-300/80 bg-amber-500/30 text-amber-100 shadow-[0_0_16px_rgba(255,200,80,0.6)]";
  }
  return "border-white/20 bg-black/40 text-white/60";
}

function CricketGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("cricket");
  const { data: cfg } = useGameConfig("cricket");
  const pf = useProvablyFair("cricket");
  const edge = cfg?.house_edge ?? 0.05;

  const [bet, setBet] = useState(20);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<null | {
    plan: number[]; // full outcome index plan (last is a wicket if wicketBallIndex >=0)
    wicketAt: number; // -1 if none
    balls: BallLog[]; // revealed so far
    gross: number;
    ended: boolean;
    ballIdx: number; // pointer into plan
  }>(null);
  const [msg, setMsg] = useState("");

  const netMult = useMemo(() => live ? cricketNetMult(live.gross, edge) : 1, [live, edge]);
  const cashoutAmount = live ? Math.floor(bet * netMult) : 0;
  const canBowl = !!live && !live.ended && !busy && live.ballIdx < live.plan.length;
  const canCashout = !!live && !live.ended && live.gross > 1 && !busy;

  const startInnings = useCallback(async () => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg("");
    const r = await fairCricket(pf.serverSeed, pf.clientSeed, pf.nonce, CRICKET_MAX_BALLS);
    setLive({
      plan: r.outcomes,
      wicketAt: r.wicketBallIndex,
      balls: [],
      gross: 1,
      ended: false,
      ballIdx: 0,
    });
    setBusy(false);
  }, [busy, bet, placeBet, pf]);

  const bowl = useCallback(async () => {
    if (!live || live.ended || busy) return;
    if (live.ballIdx >= live.plan.length) return;
    setBusy(true);
    const idx = live.plan[live.ballIdx];
    const o = CRICKET_OUTCOMES[idx];
    try { sfxTick(); } catch {}
    await new Promise((r) => setTimeout(r, 240));

    if (o.key === "W") {
      const balls = [...live.balls, { outcomeIdx: idx, multAfter: live.gross }];
      setLive({ ...live, balls, ended: true, ballIdx: live.ballIdx + 1 });
      record({ pnl: -bet, multiplier: 0 });
      pushMultiplierHistory("cricket", 0);
      recordMyBet({ game: "cricket", bet, multiplier: 0, payout: 0 });
      pf.consume(`cricket wicket at ball ${live.ballIdx + 1} gross=${live.gross}`);
      try { sfxBust(); } catch {}
      setMsg(`🎯 আউট! বল #${live.ballIdx + 1} · লস ${bet}`);
      setBusy(false);
      return;
    }

    const nextGross = o.runs > 0 ? +(live.gross * (1 + o.runs * CRICKET_RUN_GROWTH)).toFixed(4) : live.gross;
    const balls = [...live.balls, { outcomeIdx: idx, multAfter: nextGross }];
    const ballIdx = live.ballIdx + 1;
    const ended = ballIdx >= CRICKET_MAX_BALLS;

    if (ended) {
      const net = cricketNetMult(nextGross, edge);
      const payout = Math.floor(bet * net);
      credit(payout);
      const pnl = payout - bet;
      record({ pnl, multiplier: net });
      pushMultiplierHistory("cricket", net);
      recordMyBet({ game: "cricket", bet, multiplier: net, payout });
      pf.consume(`cricket innings ended ${CRICKET_MAX_BALLS} balls net=${net}`);
      setLive({ ...live, balls, gross: nextGross, ballIdx, ended: true });
      setMsg(`🏏 ইনিংস শেষ! +${pnl} · ${net.toFixed(2)}×`);
      try { sfxWin(net); } catch {}
    } else {
      setLive({ ...live, balls, gross: nextGross, ballIdx });
      if (o.runs >= 4) try { sfxWin(nextGross); } catch {}
      setMsg(`${o.key === "6" ? "💥 SIX!" : o.key === "4" ? "🔥 FOUR!" : `+${o.runs} রান`} · এখন ${cricketNetMult(nextGross, edge).toFixed(2)}×`);
    }
    setBusy(false);
  }, [live, busy, bet, edge, credit, record, pf]);

  const cashout = useCallback(() => {
    if (!live || live.ended || live.gross <= 1) return;
    const net = cricketNetMult(live.gross, edge);
    const payout = Math.floor(bet * net);
    credit(payout);
    const pnl = payout - bet;
    record({ pnl, multiplier: net });
    pushMultiplierHistory("cricket", net);
    recordMyBet({ game: "cricket", bet, multiplier: net, payout });
    pf.consume(`cricket cashout balls=${live.ballIdx} net=${net}`);
    setLive({ ...live, ended: true });
    setMsg(`💰 ক্যাশ-আউট! +${pnl} · ${net.toFixed(2)}× · ${live.ballIdx} বল`);
  }, [live, bet, edge, credit, record, pf]);

  const overs = live ? Math.floor(live.ballIdx / 6) : 0;
  const ballInOver = live ? live.ballIdx % 6 : 0;

  return (
    <GameShell title="Cricket Star · Six-Over Chase" emoji="🏏" gameKey="cricket">
      <GameFrame>
        <div
          className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-emerald-400/30 p-4 min-h-[420px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,220,120,0.14), transparent 55%), radial-gradient(circle at 50% 90%, rgba(80,220,140,0.20), transparent 55%), linear-gradient(180deg, #0a1a10 0%, #072a18 55%, #04150c 100%)",
          }}
        >
          {/* Pitch */}
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{ background: "repeating-linear-gradient(90deg, transparent 0 60px, rgba(255,255,255,0.05) 60px 61px)" }}
          />

          <div className="relative z-[2] text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300/90">Six-Over Chase</div>
            <div className="text-2xl font-black text-white">🏏 ক্রিকেট স্টার 🏏</div>
            <div className="mt-1 text-[11px] text-white/60">
              প্রতি বল = ১টা রান আউটকাম · প্রতি রান মাল্ট বাড়ায় {(CRICKET_RUN_GROWTH * 100).toFixed(0)}% · উইকেট = বাস্ট
            </div>
          </div>

          {/* Big multiplier display */}
          <div className="relative z-[2] mx-auto flex flex-col items-center">
            <div
              className={`text-6xl font-black leading-none ${
                live?.ended && live.gross <= 1 ? "text-rose-400" : "text-amber-200"
              }`}
              style={{ textShadow: "0 0 24px rgba(255,200,80,0.5)" }}
            >
              {(live ? netMult : cricketNetMult(1, edge)).toFixed(2)}×
            </div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-widest text-white/60">
              {live ? `Payout at cashout: ${cashoutAmount}` : `Bet ${bet} · edge ${(edge * 100).toFixed(1)}%`}
            </div>
          </div>

          {/* Over meter */}
          {live && (
            <div className="relative z-[2] mx-auto flex items-center gap-3 rounded-full border border-emerald-300/50 bg-black/40 px-4 py-1.5 text-xs font-black text-emerald-200">
              <span>Over {overs}.{ballInOver}</span>
              <span className="text-white/40">·</span>
              <span>Balls {live.ballIdx}/{CRICKET_MAX_BALLS}</span>
              <span className="text-white/40">·</span>
              <span className="text-amber-200">{live.balls.reduce((a, b) => a + CRICKET_OUTCOMES[b.outcomeIdx].runs, 0)} রান</span>
            </div>
          )}

          {/* Ball-by-ball strip */}
          {live && live.balls.length > 0 && (
            <div className="relative z-[2] mx-auto grid w-full max-w-[560px] grid-cols-6 gap-1.5">
              {live.balls.map((b, i) => {
                const o = CRICKET_OUTCOMES[b.outcomeIdx];
                return (
                  <div
                    key={i}
                    className={`grid h-10 place-items-center rounded-md border text-sm font-black ${outcomeStyle(o.key)}`}
                    title={`Ball ${i + 1}: ${o.label} · ${b.multAfter.toFixed(2)}× gross`}
                  >
                    {o.key}
                  </div>
                );
              })}
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
            value={`${(live ? netMult : cricketNetMult(1, edge)).toFixed(2)}×`}
            sub={<>Bet {bet} · edge {(edge * 100).toFixed(1)}%</>}
          />
          <BetControls bet={bet} setBet={setBet} disabled={busy || (live !== null && !live.ended)} />
          {!live || live.ended ? (
            <PrimaryButton onClick={startInnings} disabled={busy}>
              {busy ? "লোড হচ্ছে..." : `🏏 ইনিংস শুরু (${bet})`}
            </PrimaryButton>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton onClick={bowl} disabled={!canBowl}>
                ⚾ পরের বল
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
        <MultiplierHistoryStrip gameKey="cricket" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />

      {/* Paytable */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">
          Outcome table · per-ball probability & mult step
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
          {CRICKET_OUTCOMES.map((o, i) => {
            const prev = i === 0 ? 0 : CRICKET_OUTCOMES[i - 1].threshold;
            const prob = ((o.threshold - prev) * 100).toFixed(1);
            const step = o.key === "W" ? "BUST" : o.runs === 0 ? "—" : `×${(1 + o.runs * CRICKET_RUN_GROWTH).toFixed(2)}`;
            return (
              <div key={o.key} className={`rounded-lg border p-2 text-center ${outcomeStyle(o.key)}`}>
                <div className="text-[10px] font-black uppercase tracking-widest">{o.label}</div>
                <div className="text-lg font-black">{o.key}</div>
                <div className="text-[11px] font-black">{step}</div>
                <div className="text-[9px] opacity-70">{prob}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <ProvablyFairPanel pf={pf} gameKey="cricket" />
      </div>
    </GameShell>
  );
}
