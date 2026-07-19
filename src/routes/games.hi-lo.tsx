import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { fairFloats } from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust } from "@/lib/sound";

export const Route = createFileRoute("/games/hi-lo")({
  head: () => ({ meta: [
    { title: "Hi-Lo — Asik Game" },
    { name: "description", content: "Guess if the next card is higher or lower." },
  ]}),
  component: HiLoGame,
});

const rankFromFloat = (f: number) => 1 + Math.floor(f * 13);
const label = (r: number) => ({ 1: "A", 11: "J", 12: "Q", 13: "K" } as Record<number, string>)[r] ?? String(r);

function HiLoGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("hi-lo");
  const { data: cfg } = useGameConfig("hi-lo");
  const pf = useProvablyFair("hi-lo");
  const edge = cfg?.house_edge ?? 0.03;
  const [bet, setBet] = useState(50);
  const [current, setCurrent] = useState<number>(() => 1 + Math.floor(Math.random() * 13));
  const [next, setNext] = useState<number | null>(null);
  const [chain, setChain] = useState(0);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");

  const higherProb = (14 - current - 1) / 12;
  const lowerProb = (current - 1 - 1) / 12;
  const higherMult = higherProb > 0 ? +(((1 / higherProb) * (1 - edge))).toFixed(3) : 0;
  const lowerMult = lowerProb > 0 ? +(((1 / lowerProb) * (1 - edge))).toFixed(3) : 0;

  const chainMult = useCallback(() => +Math.max(1, (chain === 0 ? 1 : 0)).toFixed(2), [chain]);

  const drawFair = useCallback(async () => {
    const [f] = await fairFloats(pf.serverSeed, pf.clientSeed, pf.nonce, 1);
    return rankFromFloat(f);
  }, [pf.serverSeed, pf.clientSeed, pf.nonce]);

  const guess = useCallback(async (dir: "hi" | "lo") => {
    if (!running) {
      if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
      setRunning(true); setMsg(""); setChain(0);
    }
    const mult = dir === "hi" ? higherMult : lowerMult;
    const n = await drawFair(); setNext(n);
    setTimeout(() => {
      const ok = dir === "hi" ? n > current : n < current;
      if (ok && mult > 0) {
        const acc = chain === 0 ? mult : +(chainMult() * mult).toFixed(3);
        setChain((c) => c + 1);
        setCurrent(n); setNext(null);
        setMsg(`✅ ঠিক · সিরিজ ${acc.toFixed(2)}×`);
        pf.consume(`draw=${label(n)} · guess=${dir}`);
      } else {
        setRunning(false);
        const pnl = -bet;
        setMsg(`💥 হার ${pnl}`);
        record({ pnl, multiplier: 0 });
        pushMultiplierHistory("hi-lo", 0);
        recordMyBet({ game: "hi-lo", bet, multiplier: 0, payout: 0 });
        setChain(0); setCurrent(1 + Math.floor(Math.random() * 13)); setNext(null);
        pf.consume(`draw=${label(n)} · bust`);
        try { sfxBust(); } catch {}
      }
    }, 300);
  }, [running, bet, current, chain, higherMult, lowerMult, placeBet, record, chainMult, drawFair, pf]);

  const cashout = useCallback(() => {
    if (!running || chain === 0) return;
    const mult = +(Math.pow(2 * (1 - edge), chain)).toFixed(3);
    const w = Math.floor(bet * mult); credit(w);
    const pnl = w - bet;
    setMsg(`🎉 জয় +${pnl} · ${mult}×`);
    record({ pnl, multiplier: mult });
    pushMultiplierHistory("hi-lo", mult);
    recordMyBet({ game: "hi-lo", bet, multiplier: mult, payout: w });
    setRunning(false); setChain(0); setCurrent(1 + Math.floor(Math.random() * 13));
    try { sfxWin(mult); } catch {}
  }, [running, chain, bet, edge, credit, record]);

  const finalMult = +(Math.pow(2 * (1 - edge), chain)).toFixed(3);

  return (
    <GameShell title="Hi-Lo" emoji="⬆️⬇️" gameKey="hi-lo">
      <GameFrame>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-[#1a3321] bg-gradient-to-b from-[#0a120b] via-[#070f08] to-[#020604] p-6 min-h-[340px]">
          <div className="flex items-center gap-6">
            <div className="grid h-48 w-32 place-items-center rounded-2xl border-2 border-white/40 bg-white/5 text-5xl font-black text-white">
              {label(current)}
            </div>
            <div className="text-3xl text-white/50">→</div>
            <div className={`grid h-48 w-32 place-items-center rounded-2xl border-2 text-5xl font-black transition ${
              next === null ? "border-white/20 bg-black/40 text-white/40" : "border-yellow-400 bg-yellow-500/20 text-yellow-200"
            }`}>{next === null ? "?" : label(next)}</div>
          </div>
          {msg && <div className="text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
        </div>
        <ControlsPanel>
          <MultDisplay label="সিরিজ" value={`${chain}`} sub={<>ক্যাশআউট: <span className="text-cyan-300">{finalMult.toFixed(2)}×</span></>} />
          <BetControls bet={bet} setBet={setBet} disabled={running} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => guess("hi")} disabled={higherMult <= 0}
              className="rounded-xl bg-emerald-500 py-4 font-black text-white hover:brightness-110 disabled:opacity-40">
              ⬆ উচ্চ · {higherMult.toFixed(2)}×
            </button>
            <button onClick={() => guess("lo")} disabled={lowerMult <= 0}
              className="rounded-xl bg-rose-500 py-4 font-black text-white hover:brightness-110 disabled:opacity-40">
              ⬇ নিম্ন · {lowerMult.toFixed(2)}×
            </button>
          </div>
          <PrimaryButton onClick={cashout} tone="gold" disabled={!running || chain === 0}>
            ক্যাশআউট · {Math.floor(bet * finalMult)}
          </PrimaryButton>
        </ControlsPanel>
      </GameFrame>
      <div className="mt-3"><MultiplierHistoryStrip gameKey="hi-lo" /></div>
      <StatsBar stats={stats} onReset={resetStats} />
      <div className="mt-3"><ProvablyFairPanel pf={pf} gameKey="hi-lo" /></div>
    </GameShell>
  );
}
