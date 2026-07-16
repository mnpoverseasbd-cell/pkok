import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { GameShell } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useAutoBet } from "@/hooks/useAutoBet";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { AutoBetPanel, ModeTabs } from "@/components/games/AutoBetPanel";
import { fairMines, fairFloats } from "@/lib/provablyFair";

export const Route = createFileRoute("/games/mines")({
  head: () => ({ meta: [{ title: "Mines — Asik Game" }, { name: "description", content: "Reveal gems, dodge mines." }] }),
  component: Mines,
});

const SIZE = 25;

function multiplier(picks: number, mines: number, edge: number): number {
  let m = 1;
  for (let i = 0; i < picks; i++) m *= (SIZE - i) / (SIZE - i - mines);
  return +(m * (1 - edge)).toFixed(2);
}

function Mines() {
  const { bet: placeBet, credit, balance } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("mines");
  const { data: cfg } = useGameConfig("mines");
  const edge = cfg?.house_edge ?? 0.03;
  const pf = useProvablyFair("mines");
  const [bet, setBet] = useState(50);
  const [mines, setMines] = useState(3);
  const [active, setActive] = useState(false);
  const [board, setBoard] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [dead, setDead] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [autoPicks, setAutoPicks] = useState(3);

  const picks = revealed.size;
  const mult = useMemo(() => (picks > 0 ? multiplier(picks, mines, edge) : 1), [picks, mines, edge]);
  const nextMult = useMemo(() => multiplier(picks + 1, mines, edge), [picks, mines, edge]);
  const potential = Math.floor(bet * mult);
  const MIN_BET = cfg?.min_bet ?? 10;
  const MAX_BET = cfg?.max_bet ?? 500;
  const clampBet = (n: number) => Math.max(MIN_BET, Math.min(MAX_BET, Math.round(n)));

  const start = async () => {
    if (!pf.ready) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    const positions = await fairMines(pf.serverSeed, pf.clientSeed, pf.nonce, SIZE, mines);
    setBoard(new Set(positions));
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
      pf.consume(`bust mines=${mines} picks=${revealed.size}`);
      recordMyBet({ game: "mines", bet, multiplier: 0, payout: 0 });
      return;
    }
    const next = new Set(revealed);
    next.add(i);
    setRevealed(next);
    if (next.size + mines === SIZE) {
      const finalMult = multiplier(next.size, mines, edge);
      const win = Math.floor(bet * finalMult);
      credit(win);
      setMsg(`🏆 ক্লিয়ার! +${win - bet}`);
      record({ pnl: win - bet, multiplier: finalMult });
      pf.consume(`clear mines=${mines} mult=${finalMult}×`);
      recordMyBet({ game: "mines", bet, multiplier: finalMult, payout: win });
      setActive(false);
    }
  };

  const cashout = () => {
    if (!active || picks === 0) return;
    credit(potential);
    setMsg(`🎉 ক্যাশআউট +${potential - bet}`);
    record({ pnl: potential - bet, multiplier: mult });
    pf.consume(`cashout mines=${mines} picks=${picks} mult=${mult}×`);
    recordMyBet({ game: "mines", bet, multiplier: mult, payout: potential });
    setActive(false);
  };

  // Auto-bet round: use PF for mine positions, then use extra fair floats for auto-pick order.
  const runAutoRound = useCallback(async (roundBet: number) => {
    if (!pf.ready) return { pnl: 0 };
    if (!placeBet(roundBet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return { pnl: 0 }; }
    const positions = await fairMines(pf.serverSeed, pf.clientSeed, pf.nonce, SIZE, mines);
    const bombSet = new Set(positions);
    setBoard(bombSet);
    setRevealed(new Set());
    setDead(null);
    setActive(true);
    setMsg("");

    // Derive pick order from a separate nonce space (nonce+cursor via same seeds).
    // Simple approach: pick cells 0..SIZE-1 shuffled deterministically via extra floats.
    const shuffleFloats = await fairFloats(pf.serverSeed, pf.clientSeed + ":pick", pf.nonce, SIZE);
    const order = Array.from({ length: SIZE }, (_, i) => i);
    for (let i = SIZE - 1; i > 0; i--) {
      const j = Math.floor(shuffleFloats[i] * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    const wantPicks = Math.min(autoPicks, SIZE - mines);
    const picked = new Set<number>();
    for (let k = 0; k < wantPicks; k++) {
      const cell = order[k];
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 150));
      if (bombSet.has(cell)) {
        setDead(cell);
        setActive(false);
        setMsg(`💥 বুম @ ${k} picks · -${roundBet}`);
        record({ pnl: -roundBet, multiplier: 0 });
        pf.consume(`auto bust mines=${mines} picks=${k}`);
        return { pnl: -roundBet };
      }
      picked.add(cell);
      setRevealed(new Set(picked));
    }
    const finalMult = multiplier(wantPicks, mines, edge);
    const win = Math.floor(roundBet * finalMult);
    credit(win);
    const pnl = win - roundBet;
    setMsg(`🎉 অটো ক্যাশ +${pnl} @ ${finalMult}×`);
    record({ pnl, multiplier: finalMult });
    pf.consume(`auto cashout mines=${mines} picks=${wantPicks} mult=${finalMult}×`);
    setActive(false);
    return { pnl };
  }, [pf, placeBet, credit, edge, mines, autoPicks, record]);

  const auto = useAutoBet({ runRound: runAutoRound, baseBet: bet, delayMs: 600 });

  return (
    <GameShell title="Mines" emoji="💣" gameKey="mines">
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
                    <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto h-1/2 w-1/2 text-[#00ff88] drop-shadow-[0_0_6px_rgba(0,255,136,0.8)]" fill="currentColor">
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
                    <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto h-1/2 w-1/2 text-[#ff4444]" fill="currentColor">
                      <path d="M12 2L15 8H21L16 12L18 18L12 14L6 18L8 12L3 8H9L12 2Z" />
                    </svg>
                  </div>
                );
              }

              return (
                <button
                  key={i}
                  onClick={() => click(i)}
                  disabled={!active || mode === "auto"}
                  className="group aspect-square rounded-xl border-b-4 border-black bg-gradient-to-br from-[#1b2b1d] to-[#0a120b] transition-all hover:from-[#243a26] hover:to-[#0d1610] hover:border-b-[6px] active:translate-y-1 active:border-b-0 disabled:cursor-default disabled:opacity-70 disabled:hover:from-[#1b2b1d] disabled:hover:to-[#0a120b] disabled:hover:border-b-4"
                >
                  <span className="block text-2xl font-bold text-[var(--neon-gold)] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)] transition-transform group-hover:scale-110">?</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="flex w-full flex-col gap-5 rounded-2xl border border-[#1a3321] bg-[#0a120b] p-5 lg:w-80">
          <ModeTabs mode={mode} setMode={setMode} disabled={active || auto.running} />

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#00ff88]">গুণিতক</span>
            <div className="text-4xl font-bold tracking-tighter text-white">
              {mult.toFixed(2)}<span className="ml-1 text-2xl text-[#00ff88]">×</span>
            </div>
            {active && picks > 0 && mode === "manual" && (
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
                type="number" min={MIN_BET} max={MAX_BET} value={bet}
                disabled={active || auto.running}
                onChange={(e) => setBet(clampBet(Number(e.target.value) || MIN_BET))}
                className="w-full rounded-lg border border-[#1a3321] bg-[#112216] p-4 pr-24 font-bold text-white outline-none focus:border-[#00ff88] disabled:opacity-60"
              />
              <div className="absolute bottom-2 right-2 top-2 flex gap-1">
                <button disabled={active || auto.running} onClick={() => setBet(clampBet(bet / 2))} className="rounded bg-[#1a3321] px-2 text-xs font-bold text-white hover:bg-[#254a30] disabled:opacity-40">½</button>
                <button disabled={active || auto.running} onClick={() => setBet(clampBet(bet * 2))} className="rounded bg-[#1a3321] px-2 text-xs font-bold text-white hover:bg-[#254a30] disabled:opacity-40">2×</button>
              </div>
            </div>
          </div>

          {/* Mines Slider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/60">মাইন সংখ্যা</label>
              <span className="font-bold text-[#00ff88]">{mines}</span>
            </div>
            <input
              type="range" min={1} max={20} value={mines}
              disabled={active || auto.running}
              onChange={(e) => setMines(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#112216] accent-[#00ff88] disabled:opacity-50"
            />
          </div>

          {/* Auto-mode: picks per round */}
          {mode === "auto" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-white/60">অটো Picks / রাউন্ড</label>
                <span className="font-bold text-[var(--neon-gold)]">{autoPicks}</span>
              </div>
              <input
                type="range" min={1} max={SIZE - mines} value={Math.min(autoPicks, SIZE - mines)}
                disabled={auto.running}
                onChange={(e) => setAutoPicks(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#112216] accent-[var(--neon-gold)] disabled:opacity-50"
              />
              <div className="text-[10px] text-white/40">
                টার্গেট মাল্টিপ্লায়ার: <span className="text-[#00ff88]">{multiplier(Math.min(autoPicks, SIZE - mines), mines, edge).toFixed(2)}×</span>
              </div>
            </div>
          )}

          {/* Main Action */}
          {mode === "manual" ? (
            !active ? (
              <button
                onClick={start} disabled={!pf.ready}
                className="w-full rounded-xl bg-[#00ff88] py-5 text-xl font-extrabold uppercase tracking-wider text-[#050a06] shadow-[0_6px_0_0_#00884a] transition-all hover:bg-[#00e07a] active:translate-y-1 active:shadow-none disabled:opacity-40"
              >
                শুরু · বেট {bet}
              </button>
            ) : (
              <button
                onClick={cashout} disabled={picks === 0}
                className="w-full rounded-xl bg-[var(--neon-gold)] py-5 text-xl font-extrabold uppercase tracking-wider text-[#050a06] shadow-[0_6px_0_0_#a37f00] transition-all hover:brightness-110 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                ক্যাশআউট · {potential}
              </button>
            )
          ) : (
            <AutoBetPanel auto={auto} canStart={pf.ready && !active} />
          )}

          {msg && <div className="animate-fade-in text-center text-sm font-bold text-[var(--neon-gold)]">{msg}</div>}

          <ProvablyFairPanel pf={pf} gameKey="mines" />
        </div>
      </div>
    </GameShell>
  );
}
