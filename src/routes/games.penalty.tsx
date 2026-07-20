import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import {
  fairPenalty,
  penaltyLadderMult,
  PENALTY_ZONES,
  PENALTY_MAX_KICKS,
  PENALTY_BASE_MULT,
} from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust, sfxTick as sfxClick } from "@/lib/sound";

export const Route = createFileRoute("/games/penalty")({
  head: () => ({ meta: [
    { title: "Penalty Shootout · Golden Boot — Asik Game" },
    { name: "description", content: "৬ কর্নার — গোলকিপারকে ফাঁকি দিয়ে গোল করুন, প্রতি গোলে মাল্টিপ্লায়ার বাড়ে। যেকোনো মুহূর্তে ক্যাশ-আউট করুন।" },
    { property: "og:title", content: "Penalty Shootout · Golden Boot — Asik Game" },
    { property: "og:description", content: "Sequential penalty rounds with a rising multiplier. Cash out any time, or one save ends it all." },
  ]}),
  component: PenaltyGame,
});

type KickLog = { player: number; keeper: number; goal: boolean; mult: number };

function PenaltyGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("penalty");
  const { data: cfg } = useGameConfig("penalty");
  const pf = useProvablyFair("penalty");
  const edge = cfg?.house_edge ?? 0.05;

  const [bet, setBet] = useState(20);
  const [pick, setPick] = useState<number>(2); // TR default
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<null | {
    keeperZones: number[]; // full plan for the round
    kicks: KickLog[];
    goals: number;
    mult: number;
    ended: boolean;
  }>(null);
  const [msg, setMsg] = useState("");

  const kicksLeft = live ? PENALTY_MAX_KICKS - live.kicks.length : PENALTY_MAX_KICKS;
  const nextGoalMult = useMemo(() => {
    const g = live?.goals ?? 0;
    return penaltyLadderMult(g + 1, edge);
  }, [live?.goals, edge]);

  const startRound = useCallback(async () => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg("");
    const r = await fairPenalty(pf.serverSeed, pf.clientSeed, pf.nonce, PENALTY_MAX_KICKS);
    setLive({ keeperZones: r.keeperZones, kicks: [], goals: 0, mult: 0, ended: false });
    setBusy(false);
  }, [busy, bet, placeBet, pf]);

  const shoot = useCallback(async () => {
    if (!live || live.ended || busy) return;
    setBusy(true);
    const idx = live.kicks.length;
    const keeper = live.keeperZones[idx];
    const goal = keeper !== pick;
    try { sfxClick(); } catch {}
    await new Promise((r) => setTimeout(r, 260));

    if (goal) {
      const goals = live.goals + 1;
      const mult = penaltyLadderMult(goals, edge);
      const kicks = [...live.kicks, { player: pick, keeper, goal, mult }];
      const ended = kicks.length >= PENALTY_MAX_KICKS;
      setLive({ ...live, kicks, goals, mult, ended });
      setMsg(`⚽ গোল! ${goals} · এখন ${mult.toFixed(2)}× · আরেকবার শট নাকি ক্যাশ-আউট?`);
      try { sfxWin(mult); } catch {}
      if (ended) {
        const payout = Math.floor(bet * mult);
        credit(payout);
        const pnl = payout - bet;
        record({ pnl, multiplier: mult });
        pushMultiplierHistory("penalty", mult);
        recordMyBet({ game: "penalty", bet, multiplier: mult, payout });
        pf.consume(`penalty perfect ${goals}/${PENALTY_MAX_KICKS} @ ${mult}x`);
        setMsg(`🏆 পারফেক্ট ${goals} গোল! +${pnl} · ${mult.toFixed(2)}×`);
      }
    } else {
      const kicks = [...live.kicks, { player: pick, keeper, goal: false, mult: live.mult }];
      setLive({ ...live, kicks, ended: true });
      record({ pnl: -bet, multiplier: 0 });
      pushMultiplierHistory("penalty", 0);
      recordMyBet({ game: "penalty", bet, multiplier: 0, payout: 0 });
      pf.consume(`penalty saved after ${live.goals} goals`);
      try { sfxBust(); } catch {}
      setMsg(`🧤 সেভ! গোলকিপার ধরে ফেলেছে · লস ${bet}`);
    }
    setBusy(false);
  }, [live, busy, pick, bet, edge, credit, record, pf]);

  const cashout = useCallback(() => {
    if (!live || live.ended || live.goals === 0) return;
    const mult = live.mult;
    const payout = Math.floor(bet * mult);
    credit(payout);
    const pnl = payout - bet;
    record({ pnl, multiplier: mult });
    pushMultiplierHistory("penalty", mult);
    recordMyBet({ game: "penalty", bet, multiplier: mult, payout });
    pf.consume(`penalty cashout ${live.goals} goals @ ${mult}x`);
    setLive({ ...live, ended: true });
    setMsg(`💰 ক্যাশ-আউট! +${pnl} · ${mult.toFixed(2)}× · ${live.goals} গোল`);
  }, [live, bet, credit, record, pf]);

  const canShoot = !!live && !live.ended && !busy;
  const canCashout = !!live && !live.ended && live.goals > 0 && !busy;

  return (
    <GameShell title="Penalty Shootout · Golden Boot" emoji="⚽" gameKey="penalty">
      <GameFrame>
        <div
          className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-emerald-400/30 p-4 min-h-[420px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,220,120,0.12), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(60,255,150,0.18), transparent 60%), linear-gradient(180deg, #052015 0%, #06301c 55%, #041a0f 100%)",
          }}
        >
          {/* Pitch stripes */}
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{ background: "repeating-linear-gradient(90deg, transparent 0 40px, rgba(255,255,255,0.05) 40px 41px)" }}
          />

          <div className="relative z-[2] text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200/90">Golden Boot Round</div>
            <div className="text-2xl font-black text-white">⚽ পেনাল্টি শুটআউট ⚽</div>
            <div className="mt-1 text-[11px] text-white/60">
              ৬ কর্নারের ১টা বেছে নাও · গোলকিপার অন্য কর্নারে ঝাঁপ দিলে গোল · প্রতি গোলে {PENALTY_BASE_MULT.toFixed(2)}× র বেস মাল্ট
            </div>
          </div>

          {/* Goal frame with zone picker */}
          <div className="relative z-[2] mx-auto w-full max-w-[520px]">
            <div className="relative aspect-[16/9] rounded-xl border-4 border-white/70 bg-gradient-to-b from-white/[0.03] to-white/[0.08] shadow-[inset_0_0_40px_rgba(255,255,255,0.05)]">
              {/* Net pattern */}
              <div
                className="pointer-events-none absolute inset-0 rounded-lg opacity-30"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, transparent 0 24px, rgba(255,255,255,0.35) 24px 25px), repeating-linear-gradient(0deg, transparent 0 24px, rgba(255,255,255,0.35) 24px 25px)",
                }}
              />
              <div className="absolute inset-2 grid grid-cols-3 grid-rows-2 gap-2">
                {PENALTY_ZONES.map((z, i) => {
                  const active = pick === i;
                  const lastKick = live?.kicks[live.kicks.length - 1];
                  const showKeeper = lastKick && lastKick.keeper === i && (busy || live?.ended);
                  const showBall = lastKick && lastKick.player === i && lastKick.goal;
                  return (
                    <button
                      key={z}
                      disabled={busy || (live?.ended ?? false)}
                      onClick={() => setPick(i)}
                      className={`relative grid place-items-center rounded-md border-2 text-[10px] font-black uppercase tracking-widest transition ${
                        active
                          ? "border-amber-300 bg-amber-400/20 text-amber-100 shadow-[0_0_14px_rgba(255,200,80,0.5)]"
                          : "border-white/20 bg-black/30 text-white/70 hover:bg-black/50"
                      }`}
                    >
                      {z}
                      {showKeeper && <span className="pointer-events-none absolute text-3xl">🧤</span>}
                      {showBall && <span className="pointer-events-none absolute text-3xl animate-fade-in">⚽</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Ball on spot */}
            <div className="mt-3 flex items-center justify-center gap-2 text-2xl">
              <span className="opacity-80">⚽</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-white/60">Penalty Spot</span>
            </div>
          </div>

          {/* Live status */}
          {live && (
            <div className="relative z-[2] mx-auto flex flex-wrap items-center justify-center gap-2 text-xs font-black">
              <span className="rounded-full border border-emerald-300/50 bg-black/40 px-3 py-1 text-emerald-200">
                Goals {live.goals}
              </span>
              <span className="rounded-full border border-amber-300/50 bg-black/40 px-3 py-1 text-amber-200">
                Current {live.mult ? live.mult.toFixed(2) : "0.00"}×
              </span>
              {!live.ended && (
                <span className="rounded-full border border-cyan-300/50 bg-black/40 px-3 py-1 text-cyan-200">
                  Next goal → {nextGoalMult.toFixed(2)}×
                </span>
              )}
              <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-white/70">
                Kicks left {kicksLeft}
              </span>
            </div>
          )}

          {/* Kick history strip */}
          {live && live.kicks.length > 0 && (
            <div className="relative z-[2] mx-auto flex flex-wrap items-center justify-center gap-1.5">
              {live.kicks.map((k, i) => (
                <span
                  key={i}
                  className={`grid h-7 w-7 place-items-center rounded-md border text-sm ${
                    k.goal
                      ? "border-emerald-300 bg-emerald-500/25 text-emerald-100"
                      : "border-rose-400 bg-rose-500/25 text-rose-100"
                  }`}
                  title={`Pick ${PENALTY_ZONES[k.player]} vs Keeper ${PENALTY_ZONES[k.keeper]}`}
                >
                  {k.goal ? "⚽" : "🧤"}
                </span>
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
            label={live && !live.ended ? "Current mult" : "Base per goal"}
            value={`${(live && !live.ended ? (live.mult || nextGoalMult) : penaltyLadderMult(1, edge)).toFixed(2)}×`}
            sub={<>Bet {bet} · edge {(edge * 100).toFixed(1)}%</>}
          />
          <BetControls bet={bet} setBet={setBet} disabled={busy || (live !== null && !live.ended)} />
          {!live || live.ended ? (
            <PrimaryButton onClick={startRound} disabled={busy}>
              {busy ? "লোড হচ্ছে..." : `🎯 রাউন্ড শুরু (${bet})`}
            </PrimaryButton>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton onClick={shoot} disabled={!canShoot}>
                ⚽ শট ({nextGoalMult.toFixed(2)}×)
              </PrimaryButton>
              <button
                onClick={cashout}
                disabled={!canCashout}
                className="rounded-lg border border-amber-300/60 bg-gradient-to-b from-amber-400/25 to-amber-600/25 px-4 py-3 text-sm font-black text-amber-100 shadow-[0_0_18px_rgba(255,200,80,0.35)] transition hover:brightness-110 disabled:opacity-40"
              >
                💰 ক্যাশ-আউট {live.mult ? `(${Math.floor(bet * live.mult)})` : ""}
              </button>
            </div>
          )}
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="penalty" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />

      {/* Paytable / ladder */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">
          Ladder · consecutive goals → net multiplier
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: PENALTY_MAX_KICKS }, (_, i) => i + 1).map((g) => (
            <div key={g} className="rounded-lg border border-white/10 bg-black/40 p-2 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/60">{g} goal{g > 1 ? "s" : ""}</div>
              <div className="text-[13px] font-black text-emerald-300">{penaltyLadderMult(g, edge).toFixed(2)}×</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[10px] text-white/50">
          Save probability per kick = 1/{PENALTY_ZONES.length} · Goal probability = {(((PENALTY_ZONES.length - 1) / PENALTY_ZONES.length) * 100).toFixed(1)}%
        </div>
      </div>

      <div className="mt-3">
        <ProvablyFairPanel pf={pf} gameKey="penalty" />
      </div>
    </GameShell>
  );
}
