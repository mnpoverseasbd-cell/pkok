import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameShell, BetControls } from "@/components/games/GameShell";
import { useDemoWallet } from "@/hooks/useDemoWallet";

export const Route = createFileRoute("/games/plinko")({
  head: () => ({ meta: [{ title: "Plinko — Asik Game" }, { name: "description", content: "Drop the ball, hit multipliers." }] }),
  component: Plinko,
});

const ROWS = 10;
const BUCKETS = 11;
// symmetric multipliers, big on edges
const MULTS = [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9];

function Plinko() {
  const { bet: placeBet, credit } = useDemoWallet();
  const [bet, setBet] = useState(50);
  const [dropping, setDropping] = useState(false);
  const [path, setPath] = useState<number[]>([]); // 0=left,1=right per row
  const [bucket, setBucket] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const drop = async () => {
    if (dropping) return;
    if (!placeBet(bet)) { setMsg("Not enough balance"); return; }
    setDropping(true);
    setMsg("");
    setBucket(null);
    const p: number[] = [];
    let col = 0;
    for (let r = 0; r < ROWS; r++) {
      const step = Math.random() < 0.5 ? 0 : 1;
      p.push(step);
      col += step;
      setPath([...p]);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 140));
    }
    const b = Math.min(BUCKETS - 1, Math.max(0, col));
    setBucket(b);
    const m = MULTS[b];
    const won = Math.floor(bet * m);
    if (won > 0) credit(won);
    setMsg(m >= 1 ? `🎯 ${m}× · +${won}` : `😅 ${m}× · +${won}`);
    setDropping(false);
  };

  // ball column at each row
  let col = 0;

  return (
    <GameShell title="Plinko" emoji="🎯">
      <div className="grid gap-4 rounded-xl bg-black/40 p-6 ring-1 ring-white/10 md:grid-cols-[1fr_260px]">
        <div className="mx-auto w-full max-w-md">
          <div className="flex flex-col items-center gap-1 py-2">
            {Array.from({ length: ROWS }).map((_, r) => {
              const pegs = r + 2;
              const activeCol = path.slice(0, r + 1).reduce((a, b) => a + b, 0);
              return (
                <div key={r} className="flex gap-2">
                  {Array.from({ length: pegs }).map((_, c) => {
                    const isBall = path.length > r && c === activeCol;
                    return (
                      <div key={c} className={`h-3 w-3 rounded-full ${isBall ? "bg-[var(--neon-gold)] ring-2 ring-yellow-200 shadow-[0_0_8px_rgba(255,215,80,0.9)]" : "bg-white/40"}`} />
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-11 gap-1">
            {MULTS.map((m, i) => (
              <div key={i} className={`rounded px-1 py-1 text-center text-[10px] font-black ${
                bucket === i ? "bg-[var(--neon-gold)] text-black" : m >= 3 ? "bg-red-500/70 text-white" : m >= 1.1 ? "bg-yellow-500/70 text-black" : "bg-white/10 text-white/70"
              }`}>
                {m}×
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <BetControls bet={bet} setBet={setBet} disabled={dropping} />
          <button
            onClick={drop} disabled={dropping}
            className="rounded-lg bg-gradient-to-r from-[var(--neon-gold)] to-yellow-500 px-4 py-3 font-black text-black shadow-lg hover:brightness-110 disabled:opacity-50"
          >
            {dropping ? "Dropping..." : `DROP · Bet ${bet}`}
          </button>
          {msg && <div className="text-center text-sm font-bold text-[var(--neon-gold)] animate-fade-in">{msg}</div>}
        </div>
      </div>
    </GameShell>
  );
}
