import { Bot, Hand, Square } from "lucide-react";
import type { useAutoBet } from "@/hooks/useAutoBet";

type Auto = ReturnType<typeof useAutoBet>;

export function ModeTabs({ mode, setMode, disabled }: {
  mode: "manual" | "auto"; setMode: (m: "manual" | "auto") => void; disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg bg-[#112216] p-1 ring-1 ring-[#1a3321]">
      <button
        disabled={disabled}
        onClick={() => setMode("manual")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-widest transition ${
          mode === "manual" ? "bg-[#00ff88] text-[#050a06]" : "text-white/60 hover:text-white"
        } disabled:opacity-40`}
      >
        <Hand className="h-3 w-3" /> Manual
      </button>
      <button
        disabled={disabled}
        onClick={() => setMode("auto")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-widest transition ${
          mode === "auto" ? "bg-[#00ff88] text-[#050a06]" : "text-white/60 hover:text-white"
        } disabled:opacity-40`}
      >
        <Bot className="h-3 w-3" /> Auto
      </button>
    </div>
  );
}

export function AutoBetPanel({ auto, canStart, label = "Start Auto" }: {
  auto: Auto; canStart: boolean; label?: string;
}) {
  const { cfg, setCfg, running, progress, start, stop } = auto;
  const update = <K extends keyof typeof cfg>(k: K, v: (typeof cfg)[K]) => setCfg({ ...cfg, [k]: v });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#1a3321] bg-[#0a120b] p-3">
      <NumField label="সংখ্যা (0 = ∞)" value={cfg.numberOfBets} min={0} onChange={(v) => update("numberOfBets", v)} disabled={running} />
      <div className="grid grid-cols-2 gap-2">
        <NumField label="জয়ে %" value={cfg.onWinPct} min={-100} onChange={(v) => update("onWinPct", v)} disabled={running} suffix="%" />
        <NumField label="হারে %" value={cfg.onLossPct} min={-100} onChange={(v) => update("onLossPct", v)} disabled={running} suffix="%" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Stop Profit" value={cfg.stopOnProfit} min={0} onChange={(v) => update("stopOnProfit", v)} disabled={running} />
        <NumField label="Stop Loss" value={cfg.stopOnLoss} min={0} onChange={(v) => update("stopOnLoss", v)} disabled={running} />
      </div>

      {(running || progress.done > 0) && (
        <div className="flex items-center justify-between rounded-md bg-[#112216] px-2 py-1.5 text-[11px]">
          <span className="text-white/60">
            {progress.done}{cfg.numberOfBets ? `/${cfg.numberOfBets}` : ""} বেট
          </span>
          <span className={`font-black ${progress.profit >= 0 ? "text-[#00ff88]" : "text-[#ff4444]"}`}>
            {progress.profit >= 0 ? "+" : ""}{progress.profit}
          </span>
        </div>
      )}

      {running ? (
        <button
          onClick={stop}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff4444] py-3 text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_0_0_#8b0000] hover:brightness-110 active:translate-y-1 active:shadow-none"
        >
          <Square className="h-4 w-4 fill-current" /> STOP
        </button>
      ) : (
        <button
          onClick={start}
          disabled={!canStart}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--neon-gold)] py-3 text-sm font-black uppercase tracking-wider text-[#050a06] shadow-[0_4px_0_0_#a37f00] hover:brightness-110 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <Bot className="h-4 w-4" /> {label}
        </button>
      )}
    </div>
  );
}

function NumField({ label, value, onChange, min, disabled, suffix }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; disabled?: boolean; suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full rounded-md border border-[#1a3321] bg-[#112216] px-2 py-1.5 pr-6 text-xs font-bold text-white outline-none focus:border-[#00ff88] disabled:opacity-60"
        />
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-[10px] text-white/40">{suffix}</span>}
      </div>
    </label>
  );
}
