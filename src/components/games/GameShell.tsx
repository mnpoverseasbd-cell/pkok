import { ReactNode } from "react";
import { Coins, RefreshCw } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { useDemoWallet } from "@/hooks/useDemoWallet";

export function GameShell({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: ReactNode;
}) {
  const { balance, reset } = useDemoWallet();
  return (
    <SiteShell>
      <section
        className="min-h-[600px] px-4 py-6"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(180,120,255,0.20), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(255,220,120,0.14), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 pb-4">
          <h1 className="flex items-center gap-2 text-xl font-black text-[var(--neon-gold)]">
            <span className="text-2xl" aria-hidden>{emoji}</span>
            {title}
          </h1>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 ring-1 ring-[var(--neon-gold)]/40">
              <Coins className="h-4 w-4 text-[var(--neon-gold)]" />
              <span className="text-sm font-bold text-white">{balance.toLocaleString()}</span>
              <span className="text-[10px] text-white/60">coins</span>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white ring-1 ring-white/20 hover:bg-white/20"
              title="Reset to 1000"
            >
              <RefreshCw className="h-3 w-3" /> Reset
            </button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </section>
    </SiteShell>
  );
}

export function BetControls({
  bet,
  setBet,
  min = 10,
  max = 500,
  disabled,
}: {
  bet: number;
  setBet: (n: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const set = (n: number) => setBet(Math.max(min, Math.min(max, Math.round(n))));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-white/70">BET</span>
      <button disabled={disabled} onClick={() => set(bet / 2)} className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 disabled:opacity-40">½</button>
      <input
        type="number"
        value={bet}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => set(Number(e.target.value) || min)}
        className="w-24 rounded bg-white/90 px-2 py-1 text-center text-sm font-bold text-black disabled:opacity-60"
      />
      <button disabled={disabled} onClick={() => set(bet * 2)} className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 disabled:opacity-40">2×</button>
      <button disabled={disabled} onClick={() => set(min)} className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 disabled:opacity-40">MIN</button>
      <button disabled={disabled} onClick={() => set(max)} className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 disabled:opacity-40">MAX</button>
    </div>
  );
}
