import { ReactNode } from "react";
import { Coins, RefreshCw, Wrench } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import {
  DEFAULT_GAME_CONFIG,
  GameConfigContext,
  useGameConfig,
  useGameConfigCtx,
} from "@/hooks/useGameConfig";

export { useGameConfigCtx };

export function GameShell({
  title,
  emoji,
  gameKey,
  children,
}: {
  title: string;
  emoji: string;
  gameKey?: string;
  children: ReactNode;
}) {
  const { balance, reset } = useDemoWallet();
  const { data: cfg, isLoading } = useGameConfig(gameKey ?? "");
  const active = gameKey ? cfg ?? DEFAULT_GAME_CONFIG : DEFAULT_GAME_CONFIG;
  const disabled = !!gameKey && !isLoading && cfg && !cfg.is_enabled;

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
        <div className="mx-auto w-full max-w-5xl">
          {disabled ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-[var(--neon-gold)]/30 bg-black/50 p-10 text-center">
              <Wrench className="h-10 w-10 text-[var(--neon-gold)]" />
              <div className="text-2xl font-black text-[var(--neon-gold)]">Under Maintenance</div>
              <p className="text-sm text-white/70">এই গেমটি এখন বন্ধ আছে। অ্যাডমিন খুব শীঘ্রই চালু করবেন।</p>
            </div>
          ) : (
            <GameConfigContext.Provider value={active}>{children}</GameConfigContext.Provider>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

export function BetControls({
  bet, setBet, min, max, disabled,
}: { bet: number; setBet: (n: number) => void; min?: number; max?: number; disabled?: boolean }) {
  const cfg = useGameConfigCtx();
  const lo = min ?? cfg.min_bet ?? 10;
  const hi = max ?? cfg.max_bet ?? 500;
  const set = (n: number) => setBet(Math.max(lo, Math.min(hi, Math.round(n))));
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">বাজি</label>
      <div className="relative">
        <input
          type="number" value={bet} min={min} max={max} disabled={disabled}
          onChange={(e) => set(Number(e.target.value) || min)}
          className="w-full rounded-lg border border-[#1a3321] bg-[#112216] p-3 pr-20 font-bold text-white outline-none focus:border-[#00ff88] disabled:opacity-60"
        />
        <div className="absolute inset-y-1 right-1 flex gap-1">
          <button disabled={disabled} onClick={() => set(bet / 2)} className="rounded bg-[#1a3321] px-2 text-xs font-bold text-white hover:bg-[#254a30] disabled:opacity-40">½</button>
          <button disabled={disabled} onClick={() => set(bet * 2)} className="rounded bg-[#1a3321] px-2 text-xs font-bold text-white hover:bg-[#254a30] disabled:opacity-40">2×</button>
        </div>
      </div>
      <div className="flex gap-2">
        <button disabled={disabled} onClick={() => set(min)} className="flex-1 rounded bg-[#1a3321] py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80 hover:bg-[#254a30] disabled:opacity-40">সর্বনিম্ন</button>
        <button disabled={disabled} onClick={() => set(max)} className="flex-1 rounded bg-[#1a3321] py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80 hover:bg-[#254a30] disabled:opacity-40">সর্বোচ্চ</button>
      </div>
    </div>
  );
}

export function GameFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-3 flex flex-col gap-6 rounded-[2rem] border border-[#1a3321] bg-[#0d1a10] p-4 shadow-2xl shadow-black sm:p-6 lg:flex-row lg:p-8 ${className}`}>
      {children}
    </div>
  );
}

export function ControlsPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-5 rounded-2xl border border-[#1a3321] bg-[#0a120b] p-5 lg:w-80">
      {children}
    </div>
  );
}

export function PrimaryButton({
  onClick, disabled, children, tone = "emerald",
}: { onClick: () => void; disabled?: boolean; children: ReactNode; tone?: "emerald" | "gold" }) {
  const cls = tone === "emerald"
    ? "bg-[#00ff88] text-[#050a06] shadow-[0_6px_0_0_#00884a] hover:bg-[#00e07a]"
    : "bg-[var(--neon-gold)] text-[#050a06] shadow-[0_6px_0_0_#a37f00] hover:brightness-110";
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`w-full rounded-xl py-5 text-xl font-extrabold uppercase tracking-wider transition-all active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${cls}`}
    >
      {children}
    </button>
  );
}

export function MultDisplay({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-widest text-[#00ff88]">{label}</span>
      <div className="text-4xl font-bold tracking-tighter text-white">
        {value}
      </div>
      {sub && <div className="text-[11px] text-white/50">{sub}</div>}
    </div>
  );
}
