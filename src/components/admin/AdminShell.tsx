import { ReactNode, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users as UsersIcon,
  CreditCard,
  Gamepad2,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Menu,
  Bell,
  Search,
  Crown,
  Flag,
  BarChart3,
  Gift,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { k: "overview", label: "Dashboard", icon: LayoutDashboard, color: "from-indigo-500 to-blue-500" },
  { k: "txns", label: "Transactions", icon: ArrowLeftRight, color: "from-pink-500 to-rose-500" },
  { k: "users", label: "Users", icon: UsersIcon, color: "from-violet-500 to-purple-500" },
  { k: "methods", label: "Payments", icon: CreditCard, color: "from-amber-500 to-orange-500" },
  { k: "games", label: "Games", icon: Gamepad2, color: "from-emerald-500 to-teal-500" },
  { k: "vip", label: "VIP Tiers", icon: Crown, color: "from-yellow-500 to-amber-500" },
  { k: "promos", label: "Promotions", icon: Gift, color: "from-rose-500 to-pink-600" },
  { k: "reports", label: "Reports", icon: BarChart3, color: "from-fuchsia-500 to-pink-600" },
  { k: "flags", label: "Feature Flags", icon: Flag, color: "from-cyan-500 to-sky-600" },
  { k: "audit", label: "Audit Logs", icon: ShieldCheck, color: "from-slate-600 to-slate-800" },
] as const;

export function AdminShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  const search = useSearch({ from: "/admin" }) as { tab?: string };
  const tab = search.tab ?? "overview";
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const active = NAV.find((n) => n.k === tab) ?? NAV[0];

  const SidebarContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/30">
          <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-base font-black text-slate-800 leading-tight">PKOK</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Suite</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 p-4">
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Menu</div>
        {NAV.map((n) => {
          const isActive = tab === n.k;
          return (
            <button
              key={n.k}
              onClick={() => {
                navigate({ to: "/admin", search: { tab: n.k as any } });
                setMobileOpen(false);
              }}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-gradient-to-r from-slate-50 to-white text-slate-900 shadow-sm ring-1 ring-slate-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  isActive
                    ? `bg-gradient-to-br ${n.color} text-white shadow-md`
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                }`}
              >
                <n.icon className="h-4 w-4" strokeWidth={2.2} />
              </span>
              {n.label}
              {isActive && (
                <span className="ml-auto h-2 w-2 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View Site
        </Link>
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 p-4 text-white shadow-lg shadow-blue-500/20">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">Signed in</div>
          <div className="mt-1 truncate text-sm font-black">{user?.email || user?.phone || "Admin"}</div>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/15 backdrop-blur px-2 py-1.5 text-[11px] font-bold text-white hover:bg-white/25 transition"
          >
            <LogOut className="h-3 w-3" /> Log out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-slate-200/70">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col shadow-2xl lg:hidden">
            {SidebarContent}
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl px-4 py-4 sm:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              <span>Admin</span>
              <span>/</span>
              <span className={`bg-gradient-to-r ${active.color} bg-clip-text text-transparent`}>{active.label}</span>
            </div>
            <h1 className="truncate text-xl sm:text-2xl font-black text-slate-900">{title}</h1>
            {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search…"
                className="h-10 w-64 rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            {actions}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
