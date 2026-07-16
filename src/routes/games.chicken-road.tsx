import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust, sfxPeg } from "@/lib/sound";

export const Route = createFileRoute("/games/chicken-road")({
  head: () => ({ meta: [
    { title: "Chicken Road — Asik Game" },
    { name: "description", content: "Cross the road one lane at a time. Cash out before the crash." },
  ]}),
  component: ChickenRoadGame,
});

const LANES = 12;
const SURVIVE_BASE = 0.86;

function ChickenRoadGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("chicken-road");
  const { data: cfg } = useGameConfig("chicken-road");
  const edge = cfg?.house_edge ?? 0.02;
  const [bet, setBet] = useState(50);
  const [lane, setLane] = useState(0);
  const [active, setActive] = useState(false);
  const [dead, setDead] = useState(false);
  const [msg, setMsg] = useState("");

  const currentMult = +((1 / SURVIVE_BASE) ** lane * (1 - edge)).toFixed(3);
  const nextMult = +((1 / SURVIVE_BASE) ** (lane + 1) * (1 - edge)).toFixed(3);

  const start = useCallback(() => {
    if (active) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setActive(true); setDead(false); setLane(0); setMsg("");
  }, [active, bet, placeBet]);

  const step = useCallback(() => {
    if (!active) return;
    try { sfxPeg(0.5); } catch {}
    if (Math.random() < SURVIVE_BASE && lane + 1 < LANES) {
      setLane((l) => l + 1);
    } else if (Math.random() < SURVIVE_BASE) {
      setLane((l) => l + 1);
    } else {
      setActive(false); setDead(true);
      const pnl = -bet;
      setMsg(`💥 হার ${pnl}`);
      record({ pnl, multiplier: 0 });
      pushMultiplierHistory("chicken-road", 0);
      recordMyBet({ game: "chicken-road", bet, multiplier: 0, payout: 0 });
      try { sfxBust(); } catch {}
    }
  }, [active, lane, bet, record]);

  const cashout = useCallback(() => {
    if (!active || lane === 0) return;
    const win = Math.floor(bet * currentMult);
    credit(win);
    const pnl = win - bet;
    setActive(false);
    setMsg(`🎉 জয় +${pnl} · ${currentMult}×`);
    record({ pnl, multiplier: currentMult });
    pushMultiplierHistory("chicken-road", currentMult);
    recordMyBet({ game: "chicken-road", bet, multiplier: currentMult, payout: win });
    try { sfxWin(currentMult); } catch {}
  }, [active, lane, bet, currentMult, credit, record]);

  return (
    <GameShell title="Chicken Road" emoji="🐔" gameKey="chicken-road">
      <GameFrame>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-[#3a1f0a] bg-gradient-to-b from-[#1a0f04] via-[#0a0602] to-[#020100] p-6 min-h-[340px]">
          <div className="grid w-full grid-cols-12 gap-1">
            {Array.from({ length: LANES }).map((_, i) => (
              <div key={i} className={`h-16 rounded-md border ${
                i < lane ? "border-emerald-400/60 bg-emerald-500/20" :
                i === lane && active ? "border-yellow-400 bg-yellow-500/30 animate-pulse" :
                dead && i === lane ? "border-rose-500 bg-rose-500/30" :
                "border-white/10 bg-white/5"
              } grid place-items-center text-xs font-bold text-white/70`}>
                {i === lane && active ? "🐔" : dead && i === lane ? "💥" : i < lane ? "✓" : ""}
              </div>
            ))}
          </div>
          {msg && <div className="text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
        </div>
        <ControlsPanel>
          <MultDisplay label="বর্তমান" value={`${currentMult.toFixed(2)}×`} sub={<>পরবর্তী: <span className="text-cyan-300">{nextMult.toFixed(2)}×</span></>} />
          <BetControls bet={bet} setBet={setBet} disabled={active} />
          {!active ? (
            <PrimaryButton onClick={start}>স্টার্ট</PrimaryButton>
          ) : (
            <>
              <PrimaryButton onClick={step}>এক ধাপ এগোও</PrimaryButton>
              <PrimaryButton onClick={cashout} tone="gold">ক্যাশআউট · {Math.floor(bet * currentMult)}</PrimaryButton>
            </>
          )}
        </ControlsPanel>
      </GameFrame>
      <div className="mt-3"><MultiplierHistoryStrip gameKey="chicken-road" /></div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
