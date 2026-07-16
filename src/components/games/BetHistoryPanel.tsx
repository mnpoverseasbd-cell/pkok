import { useEffect, useMemo, useState } from "react";
import { History, Trash2 } from "lucide-react";
import { subscribeBetHistory, clearBetHistory, type BetHistoryEntry } from "@/lib/betHistory";

const GAME_EMOJI: Record<string, string> = {
  plinko: "🎯", crash: "🚀", wheel: "🎡", dice: "🎲", limbo: "📈", mines: "💣", coinflip: "🪙",
};

function fmtTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function BetHistoryPanel({ compact = false, gameFilter }: { compact?: boolean; gameFilter?: string }) {
  const [history, setHistory] = useState<BetHistoryEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");

  useEffect(() => subscribeBetHistory(setHistory), []);

  const rows = useMemo(() => {
    let r = gameFilter ? history.filter(h => h.game === gameFilter) : history;
    if (filter === "wins") r = r.filter(h => h.payout > 0);
    else if (filter === "losses") r = r.filter(h => h.payout <= 0);
    return r;
  }, [history, filter, gameFilter]);

  const totals = useMemo(() => {
    let bet = 0, won = 0, pnl = 0, wins = 0;
    for (const h of history) {
      bet += h.bet;
      won += h.payout;
      pnl += (h.payout > 0 ? h.payout - h.bet : -h.bet);
      if (h.payout > 0) wins++;
    }
    return { bet, won, pnl, wins, total: history.length };
  }, [history]);

  return (
    <div className="rounded-2xl border border-[#1a3321] bg-[#0a120b]/80 backdrop-blur">
      <div className="flex items-center justify-between border-b border-[#1a3321] px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--neon-gold)]">
          <History className="h-3.5 w-3.5" /> My Bet History
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/40">{history.length}</span>
          {history.length > 0 && (
            <button
              onClick={() => { if (confirm("Clear all bet history?")) clearBetHistory(); }}
              className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-[#ff4444]"
              title="Clear history"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="grid grid-cols-3 gap-1 border-b border-[#1a3321] px-3 py-2 text-[10px]">
          <div>
            <div className="text-white/40">Total Bet</div>
            <div className="font-mono font-bold text-white/80">{totals.bet.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-white/40">Win Rate</div>
            <div className="font-mono font-bold text-white/80">
              {totals.total ? Math.round((totals.wins / totals.total) * 100) : 0}%
            </div>
          </div>
          <div>
            <div className="text-white/40">Net P/L</div>
            <div className={`font-mono font-black ${totals.pnl >= 0 ? "text-[#00ff88]" : "text-[#ff4444]"}`}>
              {totals.pnl >= 0 ? "+" : ""}{totals.pnl.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="flex gap-1 border-b border-[#1a3321] px-2 py-1.5">
          {(["all", "wins", "losses"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                filter === f
                  ? "bg-[#00ff88]/20 text-[#00ff88]"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <div className={`overflow-y-auto ${compact ? "max-h-40" : "max-h-72"}`}>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-3 py-6 text-center">
            <History className="h-6 w-6 text-white/20" />
            <div className="text-[11px] text-white/40">
              {history.length === 0 ? "এখনো কোনো বাজি নেই।" : "কোনো ফলাফল নেই।"}
            </div>
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-[#0a120b] text-white/40">
              <tr>
                <th className="px-2 py-1.5 text-left font-bold">Time</th>
                <th className="px-2 py-1.5 text-left font-bold">Game</th>
                <th className="px-2 py-1.5 text-right font-bold">Bet</th>
                <th className="px-2 py-1.5 text-right font-bold">×</th>
                <th className="px-2 py-1.5 text-right font-bold">P/L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => {
                const won = h.payout > 0;
                const pnl = won ? h.payout - h.bet : -h.bet;
                return (
                  <tr key={h.id} className="border-t border-[#1a3321]">
                    <td className="px-2 py-1 font-mono text-white/50">{fmtTime(h.ts)}</td>
                    <td className="px-2 py-1 text-white/70">
                      <span className="mr-1">{GAME_EMOJI[h.game] || "🎮"}</span>{h.game}
                    </td>
                    <td className="px-2 py-1 text-right font-mono text-white/70">{h.bet}</td>
                    <td className={`px-2 py-1 text-right font-mono font-black ${won ? "text-[#00ff88]" : "text-white/30"}`}>
                      {h.multiplier > 0 ? `${h.multiplier.toFixed(2)}×` : "—"}
                    </td>
                    <td className={`px-2 py-1 text-right font-mono font-black ${won ? "text-[#00ff88]" : "text-[#ff4444]"}`}>
                      {won ? `+${pnl}` : pnl}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
