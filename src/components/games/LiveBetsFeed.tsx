import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { subscribeLiveBets, type LiveBet } from "@/lib/liveFeed";

const GAME_EMOJI: Record<string, string> = {
  plinko: "🎯", crash: "🚀", wheel: "🎡", dice: "🎲", limbo: "📈", mines: "💣", coinflip: "🪙",
};

export function LiveBetsFeed({ compact = false }: { compact?: boolean }) {
  const [bets, setBets] = useState<LiveBet[]>([]);
  useEffect(() => subscribeLiveBets(setBets), []);

  return (
    <div className="rounded-2xl border border-[#1a3321] bg-[#0a120b]/80 backdrop-blur">
      <div className="flex items-center justify-between border-b border-[#1a3321] px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00ff88]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff88] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00ff88]" />
          </span>
          <Activity className="h-3 w-3" /> Live Bets
        </div>
        <span className="text-[10px] text-white/40">{bets.length} recent</span>
      </div>
      <div className={`overflow-y-auto ${compact ? "max-h-40" : "max-h-72"}`}>
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-[#0a120b] text-white/40">
            <tr>
              <th className="px-3 py-1.5 text-left font-bold">User</th>
              <th className="px-2 py-1.5 text-left font-bold">Game</th>
              <th className="px-2 py-1.5 text-right font-bold">Bet</th>
              <th className="px-2 py-1.5 text-right font-bold">×</th>
              <th className="px-3 py-1.5 text-right font-bold">Payout</th>
            </tr>
          </thead>
          <tbody>
            {bets.map((b, i) => {
              const won = b.payout > 0;
              return (
                <tr
                  key={b.id}
                  className={`border-t border-[#1a3321] ${i === 0 ? "animate-fade-in bg-[#00ff88]/5" : ""} ${b.isMe ? "bg-[var(--neon-gold)]/10" : ""}`}
                >
                  <td className="px-3 py-1 font-mono text-white/80">
                    {b.isMe && <span className="mr-1 rounded bg-[var(--neon-gold)] px-1 text-[9px] font-black text-[#050a06]">YOU</span>}
                    {b.user}
                  </td>
                  <td className="px-2 py-1 text-white/60">
                    <span className="mr-1">{GAME_EMOJI[b.game] || "🎮"}</span>{b.game}
                  </td>
                  <td className="px-2 py-1 text-right font-mono text-white/70">{b.bet}</td>
                  <td className={`px-2 py-1 text-right font-mono font-black ${won ? "text-[#00ff88]" : "text-white/30"}`}>
                    {b.multiplier > 0 ? `${b.multiplier}×` : "—"}
                  </td>
                  <td className={`px-3 py-1 text-right font-mono font-black ${won ? "text-[#00ff88]" : "text-[#ff4444]"}`}>
                    {won ? `+${b.payout}` : `-${b.bet}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
