import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "mult_history:";
const MAX = 24;

export function pushMultiplierHistory(gameKey: string, value: number) {
  try {
    const key = STORAGE_PREFIX + gameKey;
    const prev = JSON.parse(localStorage.getItem(key) || "[]") as number[];
    const next = [Number(value.toFixed(2)), ...prev].slice(0, MAX);
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("mult-history", { detail: { gameKey } }));
  } catch { /* ignore */ }
}

function read(gameKey: string): number[] {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_PREFIX + gameKey) || "[]") as number[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Recent-round strip: colored pills showing the last N crash multipliers.
 * Green ≥ 2×, yellow 1.5–2×, red < 1.5×.
 */
export function MultiplierHistoryStrip({ gameKey, className }: { gameKey: string; className?: string }) {
  const [items, setItems] = useState<number[]>(() => read(gameKey));

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { gameKey: string } | undefined;
      if (!detail || detail.gameKey === gameKey) setItems(read(gameKey));
    };
    window.addEventListener("mult-history", handler);
    return () => window.removeEventListener("mult-history", handler);
  }, [gameKey]);

  if (!items.length) {
    return (
      <div className={cn("flex items-center gap-1.5 rounded-full border border-white/5 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40", className)}>
        সাম্প্রতিক ইতিহাস নেই
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5 overflow-x-auto rounded-full border border-white/5 bg-black/30 px-2 py-1.5 no-scrollbar", className)}>
      {items.map((m, i) => {
        const tone =
          m >= 2 ? "bg-[#00ff88]/15 text-[#00ff88] ring-[#00ff88]/30" :
          m >= 1.5 ? "bg-[#ffd166]/15 text-[#ffd166] ring-[#ffd166]/30" :
          "bg-[#ff4d4d]/15 text-[#ff4d4d] ring-[#ff4d4d]/30";
        return (
          <span
            key={i}
            className={cn(
              "inline-flex min-w-[46px] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums ring-1 transition-transform",
              tone,
              i === 0 && "scale-105",
            )}
          >
            {m.toFixed(2)}×
          </span>
        );
      })}
    </div>
  );
}
