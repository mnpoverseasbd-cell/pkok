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

export const Route = createFileRoute("/games/scratch-card")({
  head: () => ({ meta: [
    { title: "Scratch Card — Asik Game" },
    { name: "description", content: "Buy a card, scratch 9 tiles, match 3 to win." },
  ]}),
  component: ScratchCardGame,
});

const SYMBOLS = ["🍒","🍋","⭐","💎","7️⃣","🔔"] as const;
const PAYOUTS: Record<string, number> = { "🍒": 3, "🍋": 5, "⭐": 8, "🔔": 12, "7️⃣": 25, "💎": 50 };

function generateCard(): string[] {
  // Weighted random to keep house edge; ~40% chance of any 3-match.
  const bias = Math.random();
  const cells: string[] = [];
  let winner: string | null = null;
  if (bias < 0.4) winner = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const count = winner ? 3 : 0;
  for (let i = 0; i < 9; i++) cells.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
  if (winner) {
    const positions = new Set<number>();
    while (positions.size < count) positions.add(Math.floor(Math.random() * 9));
    for (const p of positions) cells[p] = winner;
  }
  return cells;
}

function ScratchCardGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("scratch-card");
  const { data: cfg } = useGameConfig("scratch-card");
  const edge = cfg?.house_edge ?? 0.05;
  const [bet, setBet] = useState(50);
  const [cells, setCells] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>(Array(9).fill(false));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const buy = useCallback(() => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setCells(generateCard()); setRevealed(Array(9).fill(false)); setBusy(true); setMsg("");
  }, [busy, bet, placeBet]);

  const reveal = useCallback((i: number) => {
    if (!cells || revealed[i]) return;
    const next = [...revealed]; next[i] = true; setRevealed(next);
    if (next.every(Boolean)) {
      // Settle: find any symbol appearing 3+ times → biggest payout
      const counts: Record<string, number> = {};
      for (const c of cells) counts[c] = (counts[c] ?? 0) + 1;
      let bestMult = 0;
      for (const [sym, n] of Object.entries(counts)) if (n >= 3 && (PAYOUTS[sym] ?? 0) > bestMult) bestMult = PAYOUTS[sym];
      const mult = +(bestMult * (1 - edge)).toFixed(3);
      if (mult > 0) {
        const w = Math.floor(bet * mult); credit(w);
        const pnl = w - bet;
        setMsg(`🎉 জয় +${pnl} · ${mult}×`);
        record({ pnl, multiplier: mult });
        pushMultiplierHistory("scratch-card", mult);
        recordMyBet({ game: "scratch-card", bet, multiplier: mult, payout: w });
        try { sfxWin(mult); } catch {}
      } else {
        const pnl = -bet;
        setMsg(`💥 হার ${pnl}`);
        record({ pnl, multiplier: 0 });
        pushMultiplierHistory("scratch-card", 0);
        recordMyBet({ game: "scratch-card", bet, multiplier: 0, payout: 0 });
        try { sfxBust(); } catch {}
      }
      setBusy(false);
    }
  }, [cells, revealed, bet, edge, credit, record]);

  return (
    <GameShell title="Scratch Card" emoji="🎟️" gameKey="scratch-card">
      <GameFrame>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-[#3a1050] bg-gradient-to-b from-[#160829] via-[#080215] to-[#020008] p-6 min-h-[340px]">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <button
                key={i} disabled={!cells || revealed[i]}
                onClick={() => reveal(i)}
                className={`grid h-20 w-20 place-items-center rounded-lg border-2 text-3xl transition ${
                  revealed[i]
                    ? "border-yellow-400 bg-yellow-500/10"
                    : "border-white/20 bg-gradient-to-br from-slate-600 to-slate-800 hover:brightness-110"
                }`}
              >{revealed[i] && cells ? cells[i] : "?"}</button>
            ))}
          </div>
          {msg && <div className="text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
        </div>
        <ControlsPanel>
          <MultDisplay label="সর্বোচ্চ" value="50×" sub={<>💎 = 50×, 7️⃣ = 25×, 🔔 = 12×</>} />
          <BetControls bet={bet} setBet={setBet} disabled={busy} />
          <PrimaryButton onClick={buy} disabled={busy}>{busy ? "স্ক্র্যাচ করুন..." : "কার্ড কিনুন"}</PrimaryButton>
        </ControlsPanel>
      </GameFrame>
      <div className="mt-3"><MultiplierHistoryStrip gameKey="scratch-card" /></div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
