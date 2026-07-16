import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bomb, Gem } from "lucide-react";
import { GameShell, BetControls } from "@/components/games/GameShell";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";

export const Route = createFileRoute("/games/mines")({
  head: () => ({ meta: [{ title: "Mines — Asik Game" }, { name: "description", content: "Reveal gems, dodge mines." }] }),
  component: Mines,
});

const SIZE = 25;

function randomMines(count: number): Set<number> {
  const s = new Set<number>();
  while (s.size < count) s.add(Math.floor(Math.random() * SIZE));
  return s;
}

// Fair-ish multiplier: prod of (25-i)/(25-i-mines) with 3% edge
function multiplier(picks: number, mines: number): number {
  let m = 1;
  for (let i = 0; i < picks; i++) m *= (SIZE - i) / (SIZE - i - mines);
  return +(m * 0.97).toFixed(2);
}

function Mines() {
  const { bet: placeBet, credit } = useDemoWallet();
  const [bet, setBet] = useState(50);
  const [mines, setMines] = useState(3);
  const [active, setActive] = useState(false);
  const [board, setBoard] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [dead, setDead] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const picks = revealed.size;
  const mult = useMemo(() => (picks > 0 ? multiplier(picks, mines) : 1), [picks, mines]);
  const potential = Math.floor(bet * mult);

  const start = () => {
    if (!placeBet(bet)) { setMsg("Not enough balance"); return; }
    setBoard(randomMines(mines));
    setRevealed(new Set());
    setDead(null);
    setActive(true);
    setMsg("");
  };

  const click = (i: number) => {
    if (!active || revealed.has(i)) return;
    if (board.has(i)) {
      setDead(i);
      setActive(false);
      setMsg(`💥 Boom! -${bet}`);
      return;
    }
    const next = new Set(revealed);
    next.add(i);
    setRevealed(next);
    if (next.size + mines === SIZE) {
      // cleared everything
      credit(potential);
      setMsg(`🏆 Cleared! +${potential}`);
      setActive(false);
    }
  };

  const cashout = () => {
    if (!active || picks === 0) return;
    credit(potential);
    setMsg(`🎉 Cashed +${potential}`);
    setActive(false);
  };

  return (
    <GameShell title="Mines" emoji="💣">
      <div className="grid gap-4 rounded-xl bg-black/40 p-6 ring-1 ring-white/10 md:grid-cols-[1fr_280px]">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: SIZE }).map((_, i) => {
            const isRev = revealed.has(i);
            const isBomb = dead === i || (!active && board.has(i) && (dead !== null));
            return (
              <button
                key={i} onClick={() => click(i)} disabled={!active}
                className={`aspect-square rounded-lg text-2xl font-black transition ${
                  isRev
                    ? "bg-emerald-500/80 text-white ring-2 ring-emerald-300"
                    : isBomb
                    ? "bg-red-600/80 text-white ring-2 ring-red-300"
                    : "bg-white/10 text-white/40 hover:bg-white/20"
                }`}
              >
                {isRev ? <Gem className="mx-auto h-6 w-6" /> : isBomb ? <Bomb className="mx-auto h-6 w-6" /> : "?"}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1 flex justify-between text-xs text-white/70">
              <span>Mines: {mines}</span>
              <span>Multiplier: {mult}×</span>
            </div>
            <input
              type="range" min={1} max={20} value={mines} disabled={active}
              onChange={e => setMines(Number(e.target.value))}
              className="w-full accent-[var(--neon-gold)]"
            />
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={active} />
          {!active ? (
            <button onClick={start} className="rounded-lg bg-gradient-to-r from-[var(--neon-gold)] to-yellow-500 px-4 py-3 font-black text-black shadow-lg hover:brightness-110">
              START · Bet {bet}
            </button>
          ) : (
            <button
              onClick={cashout} disabled={picks === 0}
              className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 font-black text-white shadow-lg hover:brightness-110 disabled:opacity-40"
            >
              CASH OUT · {potential}
            </button>
          )}
          {msg && <div className="text-center text-sm font-bold text-[var(--neon-gold)] animate-fade-in">{msg}</div>}
        </div>
      </div>
    </GameShell>
  );
}
