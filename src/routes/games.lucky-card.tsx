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

export const Route = createFileRoute("/games/lucky-card")({
  head: () => ({ meta: [
    { title: "Lucky Card — Asik Game" },
    { name: "description", content: "Predict red/black or high/low on the next card." },
  ]}),
  component: LuckyCardGame,
});

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RED = new Set(["♥", "♦"]);
type Bet = "red" | "black" | "high" | "low";

function drawCard() {
  const rank = 1 + Math.floor(Math.random() * 13);
  const suit = SUITS[Math.floor(Math.random() * 4)];
  return { rank, suit, red: RED.has(suit) };
}

function rankLabel(r: number) {
  return ({ 1: "A", 11: "J", 12: "Q", 13: "K" } as Record<number, string>)[r] ?? String(r);
}

function LuckyCardGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("lucky-card");
  const { data: cfg } = useGameConfig("lucky-card");
  const edge = cfg?.house_edge ?? 0.02;
  const payout = +((2) * (1 - edge)).toFixed(3);
  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState<Bet>("red");
  const [card, setCard] = useState<ReturnType<typeof drawCard> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const play = useCallback(async () => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg(""); setCard(null);
    await new Promise((r) => setTimeout(r, 350));
    const c = drawCard(); setCard(c);
    const win =
      (pick === "red" && c.red) ||
      (pick === "black" && !c.red) ||
      (pick === "high" && c.rank >= 8) ||
      (pick === "low" && c.rank <= 6);
    if (win) {
      const w = Math.floor(bet * payout);
      credit(w);
      const pnl = w - bet;
      setMsg(`🎉 জয় +${pnl}`);
      record({ pnl, multiplier: payout });
      pushMultiplierHistory("lucky-card", payout);
      recordMyBet({ game: "lucky-card", bet, multiplier: payout, payout: w });
      try { sfxWin(payout); } catch {}
    } else {
      const pnl = -bet;
      setMsg(`💥 হার ${pnl}`);
      record({ pnl, multiplier: 0 });
      pushMultiplierHistory("lucky-card", 0);
      recordMyBet({ game: "lucky-card", bet, multiplier: 0, payout: 0 });
      try { sfxBust(); } catch {}
    }
    setBusy(false);
  }, [busy, bet, pick, payout, placeBet, credit, record]);

  return (
    <GameShell title="Lucky Card" emoji="🃏" gameKey="lucky-card">
      <GameFrame>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-[#1a3321] bg-gradient-to-b from-[#0a120b] via-[#070f08] to-[#020604] p-6 min-h-[340px]">
          <div className={`grid h-56 w-40 place-items-center rounded-2xl border-2 text-6xl font-black shadow-2xl transition ${
            card ? (card.red ? "border-rose-400 bg-rose-500/10 text-rose-300" : "border-slate-300 bg-white/5 text-white") : "border-white/20 bg-black/40 text-white/40"
          }`}>
            {card ? <div className="flex flex-col items-center gap-1"><span>{card.suit}</span><span className="text-3xl">{rankLabel(card.rank)}</span></div> : "?"}
          </div>
          {msg && <div className="text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
        </div>
        <ControlsPanel>
          <MultDisplay label="পেআউট" value={`${payout.toFixed(2)}×`} />
          <div className="grid grid-cols-2 gap-2">
            {(["red","black","high","low"] as Bet[]).map((b) => (
              <button key={b} disabled={busy} onClick={() => setPick(b)}
                className={`rounded-lg py-2 text-sm font-bold uppercase tracking-wide transition ${
                  pick === b ? "bg-fuchsia-500 text-white" : "bg-white/10 text-white/80 hover:bg-white/20"
                } disabled:opacity-50`}>
                {b === "red" ? "লাল" : b === "black" ? "কালো" : b === "high" ? "উচ্চ (8+)" : "নিম্ন (≤6)"}
              </button>
            ))}
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={busy} />
          <PrimaryButton onClick={play} disabled={busy}>{busy ? "ড্রয়িং..." : "কার্ড ড্র"}</PrimaryButton>
        </ControlsPanel>
      </GameFrame>
      <div className="mt-3"><MultiplierHistoryStrip gameKey="lucky-card" /></div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
