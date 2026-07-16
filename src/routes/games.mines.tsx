import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GameShell } from "@/components/games/GameShell";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";

export const Route = createFileRoute("/games/mines")({
  head: () => ({ meta: [{ title: "Mines — Asik Game" }, { name: "description", content: "Reveal gems, dodge mines." }] }),
  component: Mines,
});

const SIZE = 25;
const MIN_BET = 10;
const MAX_BET = 500;

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
  const { bet: placeBet, credit, balance } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("mines");
  const [bet, setBet] = useState(50);
  const [mines, setMines] = useState(3);
  const [active, setActive] = useState(false);
  const [board, setBoard] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [dead, setDead] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const picks = revealed.size;
  const mult = useMemo(() => (picks > 0 ? multiplier(picks, mines) : 1), [picks, mines]);
  const nextMult = useMemo(() => multiplier(picks + 1, mines), [picks, mines]);
  const potential = Math.floor(bet * mult);

  const clampBet = (n: number) => Math.max(MIN_BET, Math.min(MAX_BET, Math.round(n)));

  const start = () => {
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
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
      setMsg(`💥 বুম! -${bet}`);
      record({ pnl: -bet, multiplier: 0 });
      return;
    }
    const next = new Set(revealed);
    next.add(i);
    setRevealed(next);
    if (next.size + mines === SIZE) {
      const finalMult = multiplier(next.size, mines);
      const win = Math.floor(bet * finalMult);
      credit(win);
      setMsg(`🏆 ক্লিয়ার! +${win - bet}`);
      record({ pnl: win - bet, multiplier: finalMult });
      setActive(false);
    }
  };

  const cashout = () => {
    if (!active || picks === 0) return;
    credit(potential);
    setMsg(`🎉 ক্যাশআউট +${potential - bet}`);
    record({ pnl: potential - bet, multiplier: mult });
    setActive(false);
  };

  return (
    <GameShell title="Mines" emoji="💣">
      <StatsBar stats={stats} onReset={resetStats} />

      <div className="mt-3 flex flex-col gap-6 rounded-[2rem] border border-[#1a3321] bg-[#0d1a10] p-4 shadow-2xl shadow-black sm:p-6 lg:flex-row lg:p-8">
        {/* Game Board */}
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {Array.from({ length: SIZE }).map((_, i) => {
              const isRev = revealed.has(i);
              const isBombHere = board.has(i);
              const showBomb = dead === i || (!active && isBombHere && dead !== null);

              if (isRev) {
                return (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl border-2 border-[#00ff88] bg-gradient-to-br from-[#00ff88]/10 to-[#004d2a] shadow-[inset_0_0_20px_rgba(0,255,136,0.3),0_0_15px_rgba(0,255,136,0.25)] animate-fade-in"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="absolute inset-0 m-auto h-1/2 w-1/2 text-[#00ff88] drop-shadow-[0_0_6px_rgba(0,255,136,0.8)]"
                      fill="currentColor"
                    >
                      <path d="M12 2L4.5 9L12 22L19.5 9L12 2Z" />
                    </svg>
                  </div>
                );
              }

              if (showBomb) {
                return (
                  <div
                    key={i}
                    className={`relative aspect-square rounded-xl border-2 border-[#ff4444] bg-gradient-to-br from-[#ff4d4d]/10 to-[#4d0000] shadow-[inset_0_0_20px_rgba(255,68,68,0.3),0_0_15px_rgba(255,68,68,0.3)] ${dead === i ? "animate-[wiggle_0.4s_ease-in-out]" : ""}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="absolute inset-0 m-auto h-1/2 w-1/2 text-[#ff4444]"
                      fill="currentColor"
                    >
                      <path d="M12 2L15 8H21L16 12L18 18L12 14L6 18L8 12L3 8H9L12 2Z" />
                    </svg>
                  </div>
                );
              }

              return (
                <button
                  key={i}
                  onClick={() => click(i)}
                  disabled={!active}
                  className="group aspect-square rounded-xl border-b-4 border-black bg-gradient-to-br from-[#1b2b1d] to-[#0a120b] transition-all hover:from-[#243a26] hover:to-[#0d1610] hover:border-b-[6px] active:translate-y-1 active:border-b-0 disabled:cursor-default disabled:opacity-70 disabled:hover:from-[#1b2b1d] disabled:hover:to-[#0a120b] disabled:hover:border-b-4"
                >
                  <span className="block text-2xl font-bold text-[var(--neon-gold)] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)] transition-transform group-hover:scale-110">
                    ?
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="flex w-full flex-col gap-5 rounded-2xl border border-[#1a3321] bg-[#0a120b] p-5 lg:w-80">
          {/* Multiplier Display */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#00ff88]">গুণিতক</span>
            <div className="text-4xl font-bold tracking-tighter text-white">
              {mult.toFixed(2)}
              <span className="ml-1 text-2xl text-[#00ff88]">×</span>
            </div>
            {active && picks > 0 && (
              <div className="text-[11px] text-white/50">
                পরবর্তী: <span className="text-[var(--neon-gold)]">{nextMult.toFixed(2)}×</span> · সম্ভাব্য জয়: <span className="text-[#00ff88]">{potential}</span>
              </div>
            )}
          </div>

          {/* Bet Amount */}
          <div className="flex flex-col gap-2">
            <div className="flex items-end justify-between">
              <label className="text-sm text-white/60">বাজির পরিমাণ</label>
              <span className="text-xs text-[var(--neon-gold)]">ব্যালেন্স: ৳{balance.toLocaleString()}</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={MIN_BET}
                max={MAX_BET}
                value={bet}
                disabled={active}
                onChange={(e) => setBet(clampBet(Number(e.target.value) || MIN_BET))}
                className="w-full rounded-lg border border-[#1a3321] bg-[#112216] p-4 pr-24 font-bold text-white outline-none focus:border-[#00ff88] disabled:opacity-60"
              />
              <div className="absolute bottom-2 right-2 top-2 flex gap-1">
                <button
                  disabled={active}
                  onClick={() => setBet(clampBet(bet / 2))}
                  className="rounded bg-[#1a3321] px-2 text-xs font-bold text-white transition-colors hover:bg-[#254a30] disabled:opacity-40"
                >
                  ½
                </button>
                <button
                  disabled={active}
                  onClick={() => setBet(clampBet(bet * 2))}
                  className="rounded bg-[#1a3321] px-2 text-xs font-bold text-white transition-colors hover:bg-[#254a30] disabled:opacity-40"
                >
                  2×
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                disabled={active}
                onClick={() => setBet(MIN_BET)}
                className="flex-1 rounded bg-[#1a3321] py-2 text-[10px] font-bold uppercase tracking-tighter text-white/80 hover:bg-[#254a30] disabled:opacity-40"
              >
                সর্বনিম্ন
              </button>
              <button
                disabled={active}
                onClick={() => setBet(MAX_BET)}
                className="flex-1 rounded bg-[#1a3321] py-2 text-[10px] font-bold uppercase tracking-tighter text-white/80 hover:bg-[#254a30] disabled:opacity-40"
              >
                সর্বোচ্চ
              </button>
            </div>
          </div>

          {/* Mines Slider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/60">মাইন সংখ্যা</label>
              <span className="font-bold text-[#00ff88]">{mines}</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={mines}
              disabled={active}
              onChange={(e) => setMines(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#112216] accent-[#00ff88] disabled:opacity-50"
            />
          </div>

          {/* Main Action */}
          {!active ? (
            <button
              onClick={start}
              className="w-full rounded-xl bg-[#00ff88] py-5 text-xl font-extrabold uppercase tracking-wider text-[#050a06] shadow-[0_6px_0_0_#00884a] transition-all hover:bg-[#00e07a] active:translate-y-1 active:shadow-none"
            >
              শুরু · বেট {bet}
            </button>
          ) : (
            <button
              onClick={cashout}
              disabled={picks === 0}
              className="w-full rounded-xl bg-[var(--neon-gold)] py-5 text-xl font-extrabold uppercase tracking-wider text-[#050a06] shadow-[0_6px_0_0_#a37f00] transition-all hover:brightness-110 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              ক্যাশআউট · {potential}
            </button>
          )}

          {msg && (
            <div className="animate-fade-in text-center text-sm font-bold text-[var(--neon-gold)]">
              {msg}
            </div>
          )}

          <div className="mt-auto flex justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#00ff88] shadow-[0_0_5px_#00ff88]" /> নিরাপদ
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[var(--neon-gold)] shadow-[0_0_5px_var(--neon-gold)]" /> প্রোভেন ফেয়ার
            </span>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
