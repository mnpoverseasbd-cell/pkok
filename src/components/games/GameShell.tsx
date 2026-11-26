import type { CSSProperties, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Coins, RefreshCw, Wrench, LogIn, ShoppingCart } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { LiveBetsFeed } from "@/components/games/LiveBetsFeed";
import { BetHistoryPanel } from "@/components/games/BetHistoryPanel";
import {
  DEFAULT_GAME_CONFIG,
  GameConfigContext,
  useGameConfig,
  useGameConfigCtx,
} from "@/hooks/useGameConfig";

export { useGameConfigCtx };

// Casino / cosmic theme tokens (global for all games)
const SPACE_BG =
  "radial-gradient(ellipse at 15% 10%, rgba(168,85,247,0.25), transparent 55%)," +
  "radial-gradient(ellipse at 85% 90%, rgba(34,211,238,0.18), transparent 55%)," +
  "radial-gradient(ellipse at 50% 50%, rgba(236,72,153,0.10), transparent 70%)," +
  "linear-gradient(180deg, #0d0424 0%, #14082e 50%, #06021a 100%)";

const PANEL_BORDER = "1px solid rgba(139,92,246,0.35)";
const PANEL_SHADOW =
  "0 0 0 1px rgba(139,92,246,0.15) inset, 0 20px 60px -20px rgba(168,85,247,0.35), 0 0 40px -10px rgba(34,211,238,0.15)";

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
  const { balance, refresh, userId, loading } = useDemoWallet();
  const { data: cfg, isLoading } = useGameConfig(gameKey ?? "");
  const active = gameKey ? cfg ?? DEFAULT_GAME_CONFIG : DEFAULT_GAME_CONFIG;
  const maintenance = !!gameKey && !isLoading && cfg && !cfg.is_enabled;
  const notLoggedIn = !loading && !userId;
  const noCoins = !loading && !!userId && balance <= 0;

  return (
    <SiteShell>
      <section className="relative min-h-[600px] overflow-hidden px-4 pt-2 pb-6" style={{ background: SPACE_BG }}>
        {/* starfield sparkles */}
        <div className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 10% 20%, #fff, transparent), radial-gradient(1px 1px at 80% 30%, #c4b5fd, transparent), radial-gradient(1.5px 1.5px at 30% 70%, #67e8f9, transparent), radial-gradient(1px 1px at 65% 85%, #fff, transparent), radial-gradient(1px 1px at 90% 55%, #f0abfc, transparent)",
            backgroundSize: "600px 600px",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 pb-3">
          <h1 className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl text-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(168,85,247,0.35), rgba(34,211,238,0.25))",
                border: PANEL_BORDER,
                boxShadow: "0 0 20px rgba(168,85,247,0.4)",
              }}
              aria-hidden>{emoji}</span>
            <span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-300 bg-clip-text text-2xl font-black uppercase tracking-wider text-transparent">
              {title}
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "rgba(10,4,30,0.7)", border: PANEL_BORDER, boxShadow: "0 0 15px rgba(168,85,247,0.25)" }}>
              <Coins className="h-4 w-4 text-[var(--neon-gold)]" />
              <span className="text-sm font-bold text-white">{balance.toLocaleString()}</span>
              <span className="text-[10px] uppercase tracking-widest text-violet-300/70">coins</span>
            </div>
            {userId && (
              <button
                onClick={refresh}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs text-white hover:brightness-125"
                style={{ background: "rgba(30,15,60,0.6)", border: PANEL_BORDER }}
                title="Refresh balance"
              >
                <RefreshCw className="h-3 w-3" /> রিফ্রেশ
              </button>
            )}
            <Link
              to="/wallet"
              search={{ tab: "deposit" }}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black text-[#050a06] hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #fde047 0%, #f59e0b 100%)",
                boxShadow: "0 4px 14px -2px rgba(251,191,36,0.5)",
              }}
            >
              <ShoppingCart className="h-3 w-3" /> কয়েন কিনুন
            </Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-7xl">
          {maintenance ? (
            <EmptyState icon={<Wrench className="h-10 w-10 text-fuchsia-300" />} title="Under Maintenance"
              desc="এই গেমটি এখন বন্ধ আছে। অ্যাডমিন খুব শীঘ্রই চালু করবেন।" />
          ) : notLoggedIn ? (
            <EmptyState icon={<LogIn className="h-10 w-10 text-cyan-300" />} title="লগইন প্রয়োজন"
              desc="গেম খেলতে হলে অ্যাকাউন্টে লগইন করুন।"
              cta={
                <div className="flex gap-2">
                  <Link to="/login" className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2 text-sm font-black text-white shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:brightness-110">লগইন</Link>
                  <Link to="/register" className="rounded-xl px-5 py-2 text-sm font-black text-white hover:brightness-125"
                    style={{ background: "rgba(30,15,60,0.6)", border: PANEL_BORDER }}>রেজিস্টার</Link>
                </div>
              }
            />
          ) : noCoins ? (
            <EmptyState icon={<Coins className="h-10 w-10 text-[var(--neon-gold)]" />} title="কয়েন নেই"
              desc="খেলতে হলে আগে কয়েন কিনতে হবে।"
              cta={
                <Link to="/wallet" search={{ tab: "deposit" }}
                  className="rounded-xl px-5 py-2 text-sm font-black text-[#050a06] hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#fde047,#f59e0b)", boxShadow: "0 4px 14px -2px rgba(251,191,36,0.5)" }}>
                  কয়েন কিনুন
                </Link>
              }
            />
          ) : (
            <GameConfigContext.Provider value={active}>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0">{children}</div>
                <aside className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
                  <LiveBetsFeed />
                  <BetHistoryPanel />
                </aside>
              </div>
            </GameConfigContext.Provider>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function EmptyState({ icon, title, desc, cta }: { icon: ReactNode; title: string; desc: string; cta?: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl p-10 text-center"
      style={{ background: "rgba(10,4,30,0.7)", border: PANEL_BORDER, boxShadow: PANEL_SHADOW }}>
      {icon}
      <div className="bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-2xl font-black text-transparent">{title}</div>
      <p className="text-sm text-violet-200/70">{desc}</p>
      {cta}
    </div>
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
      <label className="text-xs font-bold uppercase tracking-widest text-cyan-300">বাজি (৳{lo}–৳{hi})</label>
      <div className="relative">
        <input
          type="number" value={bet} min={lo} max={hi} disabled={disabled}
          onChange={(e) => set(Number(e.target.value) || lo)}
          className="w-full rounded-xl p-3 pr-20 font-bold text-white outline-none focus:brightness-125 disabled:opacity-60"
          style={{ background: "rgba(10,4,30,0.7)", border: PANEL_BORDER }}
        />
        <div className="absolute inset-y-1 right-1 flex gap-1">
          <button disabled={disabled} onClick={() => set(bet / 2)}
            className="rounded-lg px-2 text-xs font-bold text-white hover:brightness-125 disabled:opacity-40"
            style={{ background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.4)" }}>½</button>
          <button disabled={disabled} onClick={() => set(bet * 2)}
            className="rounded-lg px-2 text-xs font-bold text-white hover:brightness-125 disabled:opacity-40"
            style={{ background: "rgba(34,211,238,0.2)", border: "1px solid rgba(34,211,238,0.4)" }}>2×</button>
        </div>
      </div>
      <div className="flex gap-2">
        <button disabled={disabled} onClick={() => set(lo)}
          className="flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80 hover:brightness-125 disabled:opacity-40"
          style={{ background: "rgba(30,15,60,0.6)", border: PANEL_BORDER }}>সর্বনিম্ন</button>
        <button disabled={disabled} onClick={() => set(hi)}
          className="flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80 hover:brightness-125 disabled:opacity-40"
          style={{ background: "rgba(30,15,60,0.6)", border: PANEL_BORDER }}>সর্বোচ্চ</button>
      </div>
    </div>
  );
}

export function GameFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-3 flex flex-col gap-6 rounded-[2rem] p-4 sm:p-6 lg:flex-row lg:p-8 ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(20,8,46,0.85) 0%, rgba(10,4,26,0.9) 100%)",
        border: PANEL_BORDER,
        boxShadow: PANEL_SHADOW,
      }}>
      {children}
    </div>
  );
}

export function ControlsPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-5 rounded-2xl p-5 lg:w-80"
      style={{
        background: "linear-gradient(180deg, rgba(30,15,60,0.7), rgba(10,4,26,0.85))",
        border: PANEL_BORDER,
        boxShadow: "0 0 20px -5px rgba(168,85,247,0.3) inset",
      }}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  onClick, disabled, children, tone = "emerald",
}: { onClick: () => void; disabled?: boolean; children: ReactNode; tone?: "emerald" | "gold" }) {
  const style: CSSProperties = tone === "gold"
    ? {
        background: "linear-gradient(135deg, #fde047 0%, #f59e0b 60%, #ea580c 100%)",
        color: "#1a0a00",
        boxShadow: "0 6px 0 0 #a3520c, 0 0 30px -5px rgba(251,191,36,0.6)",
      }
    : {
        background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)",
        color: "#fff",
        boxShadow: "0 6px 0 0 #4c1d95, 0 0 35px -5px rgba(168,85,247,0.7)",
      };
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={style}
      className="w-full rounded-2xl py-5 text-xl font-extrabold uppercase tracking-wider transition-all active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
    >
      {children}
    </button>
  );
}

export function MultDisplay({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl p-4"
      style={{
        background: "linear-gradient(180deg, rgba(76,29,149,0.35), rgba(10,4,26,0.6))",
        border: PANEL_BORDER,
      }}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">{label}</span>
      <div className="bg-gradient-to-r from-fuchsia-200 via-white to-cyan-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
        {value}
      </div>
      {sub && <div className="text-[11px] text-violet-200/60">{sub}</div>}
    </div>
  );
}
