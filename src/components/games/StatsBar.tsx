import { RotateCcw, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { GameStats } from "@/hooks/useGameStats";

export function StatsBar({ stats, onReset }: { stats: GameStats; onReset: () => void }) {
  const winRate = stats.rounds > 0 ? Math.round((stats.wins / stats.rounds) * 100) : 0;
  const pnlPositive = stats.pnl >= 0;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-black/40 p-3 ring-1 ring-white/10">
      <Stat label="Rounds" value={stats.rounds} />
      <Stat label="Win" value={stats.wins} valueClass="text-green-400" />
      <Stat label="Lose" value={stats.losses} valueClass="text-red-400" />
      <Stat label="Win %" value={`${winRate}%`} />
      <Stat
        label="P&L"
        value={`${pnlPositive ? "+" : ""}${stats.pnl.toLocaleString()}`}
        valueClass={pnlPositive ? "text-green-400" : "text-red-400"}
        icon={pnlPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      />
      <Stat
        label="Best"
        value={`${stats.bestMultiplier.toFixed(2)}×`}
        valueClass="text-[var(--neon-gold)]"
        icon={<Trophy className="h-3 w-3 text-[var(--neon-gold)]" />}
      />
      <button
        onClick={onReset}
        title="Reset stats for this game"
        className="ml-auto inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
      >
        <RotateCcw className="h-3 w-3" /> Reset stats
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = "text-white",
  icon,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-w-[70px] flex-col rounded-md bg-white/5 px-2 py-1 ring-1 ring-white/10">
      <span className="text-[10px] uppercase tracking-wide text-white/50">{label}</span>
      <span className={`inline-flex items-center gap-1 text-sm font-black tabular-nums ${valueClass}`}>
        {icon}
        {value}
      </span>
    </div>
  );
}
