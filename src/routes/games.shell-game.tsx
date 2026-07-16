import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust } from "@/lib/sound";

export const Route = createFileRoute("/games/shell-game")({
  head: () => ({ meta: [
    { title: "Shell Game — Asik Game" },
    { name: "description", content: "Find the ball under one of the three shells." },
  ]}),
  component: ShellGame,
});

function ShellGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("shell-game");
  const { data: cfg } = useGameConfig("shell-game");
  const edge = cfg?.house_edge ?? 0.03;
  const payout = +(3 * (1 - edge)).toFixed(3);
  const [bet, setBet] = useState(50);
  const [ball, setBall] = useState<number | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const play = useCallback(async (idx: number) => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg(""); setPick(idx); setBall(null);
    await new Promise((r) => setTimeout(r, 600));
    const b = Math.floor(Math.random() * 3);
    setBall(b);
    if (b === idx) {
      const w = Math.floor(bet * payout); credit(w);
      const pnl = w - bet;
      setMsg(`🎉 জয় +${pnl}`);
      record({ pnl, multiplier: payout });
      pushMultiplierHistory("shell-game", payout);
      recordMyBet({ game: "shell-game", bet, multiplier: payout, payout: w });
      try { sfxWin(payout); } catch {}
    } else {
      const pnl = -bet;
      setMsg(`💥 হার ${pnl}`);
      record({ pnl, multiplier: 0 });
      pushMultiplierHistory("shell-game", 0);
      recordMyBet({ game: "shell-game", bet, multiplier: 0, payout: 0 });
      try { sfxBust(); } catch {}
    }
    setBusy(false);
  }, [busy, bet, payout, placeBet, credit, record]);

  return (
    <GameShell title="Shell Game" emoji="🥥" gameKey="shell-game">
      <GameFrame>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-[#3a2a10] bg-gradient-to-b from-[#1a1204] via-[#0a0602] to-[#020100] p-6 min-h-[340px]">
          <div className="flex gap-6">
            {[0,1,2].map((i) => (
              <button
                key={i}
                disabled={busy && pick !== null}
                onClick={() => play(i)}
                className={`grid h-32 w-32 place-items-center rounded-t-full border-2 text-6xl transition ${
                  ball !== null && i === ball ? "border-emerald-400 bg-emerald-500/20" :
                  pick === i ? "border-yellow-400 bg-yellow-500/20" :
                  "border-amber-700 bg-amber-800/40 hover:bg-amber-700/50"
                } disabled:cursor-default`}
              >
                {ball !== null && i === ball ? "🔴" : "🥥"}
              </button>
            ))}
          </div>
          {msg && <div className="text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
        </div>
        <ControlsPanel>
          <MultDisplay label="পেআউট" value={`${payout.toFixed(2)}×`} sub={<>যেকোনো ১টি শেল বাছুন</>} />
          <BetControls bet={bet} setBet={setBet} disabled={busy} />
          <PrimaryButton onClick={() => { setBall(null); setPick(null); setMsg(""); }} disabled={busy}>নতুন রাউন্ড</PrimaryButton>
        </ControlsPanel>
      </GameFrame>
      <div className="mt-3"><MultiplierHistoryStrip gameKey="shell-game" /></div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
