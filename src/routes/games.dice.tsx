import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameShell, BetControls } from "@/components/games/GameShell";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";

export const Route = createFileRoute("/games/dice")({
  head: () => ({ meta: [{ title: "Lucky Dice — Asik Game" }, { name: "description", content: "Predict the roll, win multiplier." }] }),
  component: DiceGame,
});

function DiceGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("dice");
  const [bet, setBet] = useState(50);
  const [target, setTarget] = useState(50); // roll under target wins
  const [rolling, setRolling] = useState(false);
  const [roll, setRoll] = useState<number | null>(null);
  const [msg, setMsg] = useState<string>("");

  const winChance = target; // percent
  const payout = winChance > 0 ? +(99 / winChance).toFixed(4) : 0; // 1% house edge

  const play = async () => {
    if (rolling) return;
    if (!placeBet(bet)) { setMsg("Not enough balance"); return; }
    setRolling(true);
    setMsg("");
    // spin animation
    for (let i = 0; i < 12; i++) {
      setRoll(+(Math.random() * 100).toFixed(2));
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 60));
    }
    const final = +(Math.random() * 100).toFixed(2);
    setRoll(final);
    if (final < target) {
      const won = Math.floor(bet * payout);
      credit(won);
      setMsg(`🎉 WIN +${won}`);
    } else {
      setMsg(`💥 LOSE -${bet}`);
    }
    setRolling(false);
  };

  return (
    <GameShell title="Lucky Dice" emoji="🎲">
      <div className="grid gap-4 rounded-xl bg-black/40 p-6 ring-1 ring-white/10 md:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className={`grid h-40 w-40 place-items-center rounded-2xl bg-white text-6xl font-black text-black shadow-2xl ${rolling ? "animate-pulse" : ""}`}>
            {roll?.toFixed(2) ?? "0.00"}
          </div>
          <div className="text-sm text-white/70">Roll under <span className="font-bold text-[var(--neon-gold)]">{target}</span> to win</div>
          {msg && <div className="text-lg font-black text-[var(--neon-gold)] animate-fade-in">{msg}</div>}
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1 flex justify-between text-xs text-white/70">
              <span>Target: {target}</span>
              <span>Chance: {winChance}% · Payout: {payout}×</span>
            </div>
            <input
              type="range" min={2} max={98} value={target}
              onChange={e => setTarget(Number(e.target.value))}
              disabled={rolling}
              className="w-full accent-[var(--neon-gold)]"
            />
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={rolling} />
          <button
            onClick={play} disabled={rolling}
            className="rounded-lg bg-gradient-to-r from-[var(--neon-gold)] to-yellow-500 px-4 py-3 font-black text-black shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            {rolling ? "Rolling..." : `ROLL DICE · Win ${Math.floor(bet * payout)}`}
          </button>
        </div>
      </div>
    </GameShell>
  );
}
