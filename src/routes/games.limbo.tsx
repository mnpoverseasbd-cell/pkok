import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameShell, BetControls } from "@/components/games/GameShell";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";

export const Route = createFileRoute("/games/limbo")({
  head: () => ({
    meta: [
      { title: "Limbo — Asik Game" },
      { name: "description", content: "Pick a target multiplier. If the round result is at or above your target, you win." },
    ],
  }),
  component: LimboGame,
});

function LimboGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("limbo");
  const [bet, setBet] = useState(50);
  const [target, setTarget] = useState(2.0); // target multiplier
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  // 1% house edge: winChance = 99 / target (in %)
  const winChance = Math.min(99, +(99 / target).toFixed(2));
  const payout = target;

  const play = async () => {
    if (rolling) return;
    if (target < 1.01) { setMsg("Target must be ≥ 1.01×"); return; }
    if (!placeBet(bet)) { setMsg("Not enough balance"); return; }
    setRolling(true);
    setMsg("");

    // spin animation
    for (let i = 0; i < 14; i++) {
      setResult(+(1 + Math.random() * (target * 2)).toFixed(2));
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 55));
    }

    // provably-fair-ish: uniform in (0,1], mapped so P(X>=target) = winChance%
    const u = Math.random();
    // final crash-style multiplier with 1% house edge
    const final = +Math.max(1, 0.99 / u).toFixed(2);
    setResult(final);

    if (final >= target) {
      const won = Math.floor(bet * payout);
      credit(won);
      setMsg(`🎉 WIN +${won - bet}`);
      record({ pnl: won - bet, multiplier: payout });
    } else {
      setMsg(`💥 LOSE -${bet}`);
      record({ pnl: -bet, multiplier: 0 });
    }
    setRolling(false);
  };

  return (
    <GameShell title="Limbo" emoji="🚀">
      <StatsBar stats={stats} onReset={resetStats} />
      <div className="grid gap-4 rounded-xl bg-black/40 p-6 ring-1 ring-white/10 md:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-4">
          <div
            className={`grid h-40 w-full max-w-xs place-items-center rounded-2xl bg-gradient-to-br from-black to-slate-900 text-6xl font-black shadow-2xl ring-1 ring-white/10 ${
              rolling ? "animate-pulse" : ""
            } ${result !== null && result >= target ? "text-[var(--neon-green)]" : "text-white"}`}
          >
            {result?.toFixed(2) ?? "0.00"}×
          </div>
          <div className="text-sm text-white/70">
            Target <span className="font-bold text-[var(--neon-gold)]">{target.toFixed(2)}×</span> · Chance{" "}
            <span className="font-bold text-white">{winChance}%</span>
          </div>
          {msg && <div className="text-lg font-black text-[var(--neon-gold)] animate-fade-in">{msg}</div>}
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1 flex justify-between text-xs text-white/70">
              <span>Target Multiplier</span>
              <span>Payout: {payout.toFixed(2)}×</span>
            </div>
            <input
              type="number"
              step="0.01"
              min={1.01}
              max={1000}
              value={target}
              disabled={rolling}
              onChange={(e) => setTarget(Math.max(1.01, Number(e.target.value) || 1.01))}
              className="w-full rounded-lg bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-[var(--neon-gold)]"
            />
            <div className="mt-2 flex gap-2">
              {[1.5, 2, 5, 10, 100].map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  disabled={rolling}
                  className="flex-1 rounded-md bg-white/5 px-2 py-1 text-xs font-bold text-white/80 hover:bg-white/10 disabled:opacity-50"
                >
                  {t}×
                </button>
              ))}
            </div>
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={rolling} />
          <button
            onClick={play}
            disabled={rolling}
            className="rounded-lg bg-gradient-to-r from-[var(--neon-gold)] to-yellow-500 px-4 py-3 font-black text-black shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            {rolling ? "Rolling..." : `PLAY · Win ${Math.floor(bet * payout)}`}
          </button>
        </div>
      </div>
    </GameShell>
  );
}
