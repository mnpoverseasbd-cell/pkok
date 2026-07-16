import { ReactNode } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { LayoutDashboard, ArrowLeftRight, Users as UsersIcon, CreditCard, Gamepad2, LogOut, ExternalLink, ShieldCheck, Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { k: "overview", label: "Overview", icon: LayoutDashboard },
  { k: "txns", label: "Transactions", icon: ArrowLeftRight },
  { k: "users", label: "Users", icon: UsersIcon },
  { k: "methods", label: "Payment Methods", icon: CreditCard },
  { k: "games", label: "Games", icon: Gamepad2 },
] as const;

export function AdminShell({ children, title, subtitle, actions }: { children: ReactNode; title: string; subtitle?: string; actions?: ReactNode }) {
  const navigate = useNavigate();
  const search = useSearch({ from: "/admin" }) as { tab?: string };
  const tab = search.tab ?? "overview";
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--neon-green)] to-emerald-600 text-black shadow-lg shadow-[var(--neon-green)]/30">
          <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-sm font-black text-white leading-tight">PKOK Admin</div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--neon-green)]/80">Control Center</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((n) => {
          const active = tab === n.k;
          return (
            <button
              key={n.k}
              onClick={() => { navigate({ to: "/admin", search: { tab: n.k as any } }); setMobileOpen(false); }}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-[var(--neon-green)]/15 text-[var(--neon-green)] shadow-inner shadow-[var(--neon-green)]/10"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <n.icon className={`h-4 w-4 ${active ? "text-[var(--neon-green)]" : "text-white/50 group-hover:text-white"}`} />
              {n.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--neon-green)] shadow-[0_0_8px_var(--neon-green)]" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-1">
        <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-3.5 w-3.5" /> View Site
        </Link>
        <div className="mt-2 rounded-lg bg-black/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40">Signed in</div>
          <div className="mt-0.5 truncate text-xs font-bold text-white">{user?.email || user?.phone || "Admin"}</div>
          <button onClick={logout} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[11px] font-bold text-red-400 hover:bg-red-500/20">
            <LogOut className="h-3 w-3" /> Log out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-[#0d1119] to-[#080a10]">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[#0d1119] lg:hidden">
            {SidebarContent}
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-[#0a0d14]/90 backdrop-blur px-4 py-3 sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden rounded-md border border-white/10 p-2 text-white/70">
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
              <span>Admin</span>
              <span>/</span>
              <span className="text-[var(--neon-green)]">{NAV.find(n => n.k === tab)?.label}</span>
            </div>
            <h1 className="truncate text-lg sm:text-xl font-black text-white">{title}</h1>
            {subtitle && <div className="text-xs text-white/50">{subtitle}</div>}
          </div>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
