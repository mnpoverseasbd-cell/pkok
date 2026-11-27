import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { adminSupabase as supabase } from "@/lib/admin-supabase";
import { normalizeBdPhone, phoneRegex } from "@/lib/auth-utils";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminAdjustBalance,
  adminBulkUpdateGames,
  adminCreateUser,
  adminDeleteGameConfig,
  adminDeleteUser,
  adminGetUserDetails,
  adminListAuditLogs,
  adminListFeatureFlags,
  adminListUsers,
  adminListVipTierConfigs,
  adminLogAction,
  adminPreviewVipPayouts,
  adminProcessTransaction,
  adminReports,
  adminResetUserPassword,
  adminRunVipPayouts,
  adminSyncAllGames,
  adminUpdateUser,
  adminUpdateVipTierConfig,
  adminUpsertFeatureFlag,
  adminUpsertGameConfig,
  adminDeleteFeatureFlag,
} from "@/lib/admin.functions";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, ShieldCheck, ShieldOff, Plus, Minus, Eye, EyeOff, Lock, Mail, LogOut, Users as UsersIcon, Wallet, TrendingUp, Clock, RefreshCw, Search, ArrowUpRight, ArrowDownRight, Trash2, UserPlus, Flag, BarChart3, Bell, Coins, Copy, KeyRound, Ban, Settings2, Sliders, Gamepad2, ExternalLink } from "lucide-react";
import { TxnDetailsDialog } from "@/components/TxnDetailsDialog";
import { ThumbnailDuplicateReport } from "@/components/admin/ThumbnailDuplicateReport";


const searchSchema = z.object({ tab: z.enum(["overview", "txns", "users", "methods", "games", "vip", "audit", "flags", "reports", "promos", "tournaments", "notifs"]).optional() });

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — PKOK" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AdminPage,
});

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Dashboard Overview", subtitle: "রিয়েল-টাইম প্ল্যাটফর্ম মেট্রিক্স" },
  txns: { title: "Transactions", subtitle: "Deposit / Withdraw approvals" },
  users: { title: "Users", subtitle: "সমস্ত রেজিস্টার্ড অ্যাকাউন্ট ম্যানেজ করুন" },
  methods: { title: "Payment Methods", subtitle: "bKash, Nagad, Rocket ইত্যাদি কনফিগ করুন" },
  games: { title: "Game Controls", subtitle: "Bet limits এবং house edge টিউন করুন" },
  vip: { title: "VIP Tiers", subtitle: "Deposit threshold, cashback, bonus আর limits কনফিগ করুন" },
  audit: { title: "Audit Logs", subtitle: "সমস্ত অ্যাডমিন অ্যাকশনের রেকর্ড" },
  flags: { title: "Feature Flags", subtitle: "রানটাইম ফিচার টগল করুন কোড ডিপ্লয় ছাড়াই" },
  reports: { title: "Reports", subtitle: "রেভিনিউ, GGR, top players — read-only analytics" },
  promos: { title: "Promotions", subtitle: "Deposit bonus, promo codes, wagering rules" },
  tournaments: { title: "Tournaments", subtitle: "প্রাইজ পুল টুর্নামেন্ট তৈরি ও ফিনালাইজ করুন" },
  notifs: { title: "Notifications", subtitle: "ব্রডকাস্ট মেসেজ পাঠান ও ম্যানেজ করুন" },
};

function AdminPage() {
  const { user, loading } = useAuth(supabase);
  const { isAdmin, loading: roleLoading } = useIsAdmin(user?.id, supabase);
  const search = useSearch({ from: "/admin" });
  const tab = search.tab ?? "overview";

  if (loading || (user && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" /> Loading Admin Portal…
        </div>
      </div>
    );
  }
  if (!user || !isAdmin) {
    return <AdminPortalLogin currentUser={user} />;
  }

  const meta = TAB_TITLES[tab] ?? TAB_TITLES.overview;

  return (
    <AdminShell title={meta.title} subtitle={meta.subtitle}>
      {tab === "overview" && <AdminOverview />}
      {tab === "txns" && <AdminTxns />}
      {tab === "users" && <AdminUsers />}
      {tab === "methods" && <AdminMethods />}
      {tab === "games" && <AdminGames />}
      {tab === "vip" && (
        <div className="space-y-6">
          <AdminVipTiers />
          <AdminVipHistory />
        </div>
      )}
      {tab === "audit" && <AdminAuditLogs />}
      {tab === "flags" && <AdminFeatureFlags />}
      {tab === "reports" && <AdminReports />}
      {tab === "promos" && <AdminPromotions />}
      {tab === "tournaments" && <AdminTournaments />}
      {tab === "notifs" && <AdminNotifications />}
    </AdminShell>
  );
}

function AdminPortalLogin({ currentUser }: { currentUser: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      toast.error("Admin Email এবং Password দিন");
      return;
    }
    setSubmitting(true);
    try {
      if (currentUser) {
        await supabase.auth.signOut();
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        toast.error(error.message === "Invalid login credentials" ? "Email বা Password ভুল" : error.message);
        return;
      }
      const uid = data.user?.id;
      if (!uid) {
        toast.error("লগইন ব্যর্থ হয়েছে");
        return;
      }
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) {
        await supabase.auth.signOut();
        toast.error("এই অ্যাকাউন্টে Admin অনুমতি নেই");
        return;
      }
      toast.success("Admin Portal-এ স্বাগতম");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.22), transparent 45%), radial-gradient(circle at 80% 80%, rgba(14,165,233,0.16), transparent 45%)",
        }}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl shadow-indigo-500/10 backdrop-blur sm:p-9">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="h-7 w-7" strokeWidth={2.3} />
          </div>
          <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-400">
            PKOK Control Center
          </div>
          <h1 className="mt-1 text-2xl font-black text-white">Admin Portal Login</h1>
          <p className="mt-1 text-xs text-slate-400">
            এটি সম্পূর্ণ আলাদা অ্যাডমিন পোর্টাল — শুধুমাত্র অনুমোদিত অ্যাডমিনের জন্য
          </p>
        </div>

        {currentUser && (
          <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
            <span className="truncate">
              সাইন ইন করা আছে: <b>{currentUser.email || currentUser.phone}</b> (Admin নয়)
            </span>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-400/20 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-400/30"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Admin Email
            </label>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 focus-within:border-indigo-500">
              <Mail className="h-4 w-4 text-slate-400" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@domain.com"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 focus-within:border-indigo-500">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="text-slate-400 hover:text-white"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
            {submitting ? "Verifying…" : "Sign In to Admin Portal"}
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, icon: Icon, tone = "indigo", urgent }: any) {
  const tones: Record<string, { grad: string; ring: string; shadow: string }> = {
    indigo: { grad: "from-indigo-500 via-blue-500 to-cyan-400", ring: "ring-indigo-500/20", shadow: "shadow-indigo-500/30" },
    pink:   { grad: "from-pink-500 via-rose-500 to-red-400",   ring: "ring-rose-500/20",   shadow: "shadow-rose-500/30" },
    violet: { grad: "from-violet-500 via-purple-500 to-fuchsia-500", ring: "ring-violet-500/20", shadow: "shadow-violet-500/30" },
    amber:  { grad: "from-amber-400 via-orange-500 to-rose-500", ring: "ring-orange-500/20", shadow: "shadow-orange-500/30" },
    emerald:{ grad: "from-emerald-400 via-teal-500 to-cyan-500", ring: "ring-emerald-500/20", shadow: "shadow-emerald-500/30" },
  };
  const t = tones[tone] ?? tones.indigo;
  return (
    <div className={`group relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ${t.ring} transition hover:-translate-y-0.5 hover:shadow-xl ${urgent ? "animate-pulse ring-2 ring-orange-400" : ""}`}>
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${t.grad} opacity-10 blur-2xl transition group-hover:opacity-20`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
          <div className="mt-3 text-3xl font-black text-slate-900 tabular-nums">{value}</div>
          {hint && <div className="mt-1 text-[11px] text-slate-400">{hint}</div>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${t.grad} text-white shadow-lg ${t.shadow}`}>
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState<any>({ loading: true });
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setStats((s: any) => ({ ...s, loading: true }));
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const iso = startOfDay.toISOString();
    const [users, pending, pendingWd, balances, depToday, wdToday, depAll, wdAll, recent] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("transactions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("transactions").select("amount").eq("type", "withdraw").eq("status", "pending"),
      supabase.from("profiles").select("wallet_balance"),
      supabase.from("transactions").select("amount").eq("type", "deposit").eq("status", "approved").gte("created_at", iso),
      supabase.from("transactions").select("amount").eq("type", "withdraw").eq("status", "approved").gte("created_at", iso),
      supabase.from("transactions").select("amount").eq("type", "deposit").eq("status", "approved"),
      supabase.from("transactions").select("amount").eq("type", "withdraw").eq("status", "approved"),
      supabase.from("transactions").select("id, type, status, amount, created_at, profiles!transactions_user_id_fkey(display_name, username, phone)").order("created_at", { ascending: false }).limit(6),
    ]);
    const sum = (rows: any[] | null | undefined) => (rows ?? []).reduce((a, r) => a + Number(r.amount ?? r.wallet_balance ?? 0), 0);
    setStats({
      userCount: users.count ?? 0,
      pendingCount: pending.count ?? 0,
      pendingWdCount: (pendingWd.data ?? []).length,
      pendingWdTotal: sum(pendingWd.data),
      totalBalance: sum(balances.data),
      depositsToday: sum(depToday.data),
      withdrawsToday: sum(wdToday.data),
      depositsAllTime: sum(depAll.data),
      withdrawsAllTime: sum(wdAll.data),
      recent: recent.data ?? [],
      loading: false,
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  if (stats.loading) return <div className="flex items-center gap-2 text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Loading stats…</div>;

  const revenue = stats.depositsAllTime - stats.withdrawsAllTime;
  const netToday = stats.depositsToday - stats.withdrawsToday;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/20">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/70">Welcome back to</div>
            <div className="mt-1 text-2xl sm:text-3xl font-black">PKOK Admin Dashboard</div>
            <div className="mt-1 text-sm text-white/80">সব অ্যাকাউন্ট, কয়েন, গেম উইন রেট ও উইথড্র এখান থেকেই কন্ট্রোল করুন</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 text-center min-w-[110px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Deposit Today</div>
              <div className="mt-1 text-xl font-black">৳{stats.depositsToday.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 text-center min-w-[110px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">Withdraw Today</div>
              <div className="mt-1 text-xl font-black">৳{stats.withdrawsToday.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => navigate({ to: "/admin", search: { tab: "txns" } })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-black text-indigo-700 shadow hover:bg-indigo-50"
          >
            <Clock className="h-3.5 w-3.5" /> Pending Withdraws ({stats.pendingWdCount} · ৳{stats.pendingWdTotal.toLocaleString()})
          </button>
          <button
            onClick={() => navigate({ to: "/admin", search: { tab: "users" } })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3.5 py-2 text-xs font-bold text-white backdrop-blur hover:bg-white/30"
          >
            <Coins className="h-3.5 w-3.5" /> Give Coins / Manage Users
          </button>
          <button
            onClick={() => navigate({ to: "/admin", search: { tab: "games" } })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3.5 py-2 text-xs font-bold text-white backdrop-blur hover:bg-white/30"
          >
            <Gamepad2 className="h-3.5 w-3.5" /> Game Win Rates &amp; Controls
          </button>
          <button
            onClick={() => navigate({ to: "/admin", search: { tab: "methods" } })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3.5 py-2 text-xs font-bold text-white backdrop-blur hover:bg-white/30"
          >
            <Wallet className="h-3.5 w-3.5" /> Payment Methods
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={stats.userCount.toLocaleString()} hint="Registered profiles" icon={UsersIcon} tone="indigo" />
        <StatCard label="Pending Requests" value={stats.pendingCount.toLocaleString()} hint="Awaiting approval" icon={Clock} tone="pink" urgent={stats.pendingCount > 0} />
        <StatCard label="User Balance" value={`৳${stats.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} hint="Sum of all wallets" icon={Wallet} tone="violet" />
        <StatCard label="Net Revenue" value={`৳${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} hint="Deposits − Withdraws" icon={TrendingUp} tone={revenue >= 0 ? "emerald" : "amber"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Today</div>
              <div className="text-lg font-black text-slate-900">আজকের কার্যক্রম</div>
            </div>
            <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-100">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-emerald-700"><ArrowDownRight className="h-3 w-3" /> Deposit</div>
              <div className="mt-2 text-2xl font-black text-emerald-600 tabular-nums">৳{stats.depositsToday.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 p-4 ring-1 ring-rose-100">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-rose-700"><ArrowUpRight className="h-3 w-3" /> Withdraw</div>
              <div className="mt-2 text-2xl font-black text-rose-600 tabular-nums">৳{stats.withdrawsToday.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-amber-100">
              <div className="text-[11px] font-bold uppercase text-amber-700">Net</div>
              <div className={`mt-2 text-2xl font-black tabular-nums ${netToday >= 0 ? "text-amber-600" : "text-rose-600"}`}>৳{netToday.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Recent Activity</div>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">Live</span>
          </div>
          <div className="space-y-2">
            {stats.recent.length === 0 && <div className="text-xs text-slate-400">No activity yet</div>}
            {stats.recent.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 hover:bg-slate-50">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${r.status === "approved" ? "bg-emerald-500" : r.status === "pending" ? "bg-amber-500" : "bg-rose-500"}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-slate-800">{r.profiles?.display_name || r.profiles?.username || r.profiles?.phone || "User"}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{r.type} · {r.status}</div>
                </div>
                <div className="text-sm font-black text-slate-900 tabular-nums">৳{Number(r.amount).toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div className="text-sm font-black uppercase tracking-wider text-slate-800">{title}</div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${map[status] ?? "bg-slate-50 text-slate-600 ring-slate-200"}`}>{status}</span>;
}


function AdminTxns() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [typeFilter, setTypeFilter] = useState<"all" | "withdraw" | "deposit" | "bonus">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [actionRow, setActionRow] = useState<{ row: any; nextStatus: "approved" | "rejected" } | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [acting, setActing] = useState(false);

  const processTxn = useServerFn(adminProcessTransaction);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("transactions")
      .select("id, user_id, type, status, amount, txn_reference, sender_account, receiver_account, admin_note, created_at, profiles!transactions_user_id_fkey(display_name, username, email, phone)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    if (typeFilter !== "all") q = q.eq("type", typeFilter);
    const { data, error } = await q;
    if (error) {
      const { data: d2 } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200);
      setRows(d2 ?? []);
    } else setRows(data ?? []);
    setLoading(false);
  }, [filter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      [
        r.profiles?.display_name,
        r.profiles?.username,
        r.profiles?.phone,
        r.profiles?.email,
        r.txn_reference,
        r.sender_account,
        r.receiver_account,
        r.admin_note,
      ].some((v) => v && String(v).toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const pendingStats = useMemo(() => {
    const wd = rows.filter((r) => r.status === "pending" && r.type === "withdraw");
    const dep = rows.filter((r) => r.status === "pending" && r.type === "deposit");
    return {
      wdCount: wd.length,
      wdTotal: wd.reduce((s, r) => s + Number(r.amount || 0), 0),
      depCount: dep.length,
      depTotal: dep.reduce((s, r) => s + Number(r.amount || 0), 0),
    };
  }, [rows]);

  async function confirmAction() {
    if (!actionRow) return;
    setActing(true);
    try {
      await processTxn({
        data: {
          id: actionRow.row.id,
          status: actionRow.nextStatus,
          note: actionNote.trim() || undefined,
        },
      });
      toast.success(actionRow.nextStatus === "approved" ? "Approved ✓" : "Rejected");
      setActionRow(null);
      setActionNote("");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setActing(false);
    }
  }

  function copyText(val: string) {
    navigator.clipboard?.writeText(val);
    toast.success(`Copied: ${val}`);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Pending Withdraws</div>
            <div className="mt-1 text-2xl font-black text-slate-900">৳{pendingStats.wdTotal.toLocaleString()}</div>
            <div className="text-xs text-slate-500">{pendingStats.wdCount}টি রিকোয়েস্ট অপেক্ষমান</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => { setFilter("pending"); setTypeFilter("withdraw"); }} className="border-rose-200 text-rose-600 hover:bg-rose-50">
            Filter Withdraws
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Pending Deposits</div>
            <div className="mt-1 text-2xl font-black text-slate-900">৳{pendingStats.depTotal.toLocaleString()}</div>
            <div className="text-xs text-slate-500">{pendingStats.depCount}টি রিকোয়েস্ট অপেক্ষমান</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => { setFilter("pending"); setTypeFilter("deposit"); }} className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
            Filter Deposits
          </Button>
        </div>
      </div>

      <Panel
        title={`Transactions (${filtered.length})`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search phone / txn / ref…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-48 border-slate-200 bg-slate-50 pl-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(["all", "withdraw", "deposit", "bonus"] as const).map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)} className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition ${typeFilter === t ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-900"}`}>{t}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(["pending", "approved", "rejected", "all"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition ${filter === f ? "bg-emerald-100 text-emerald-700" : "text-slate-400 hover:text-slate-900"}`}>{f}</button>
              ))}
              <button onClick={load} className="ml-1 rounded-md p-1 text-slate-400 hover:text-slate-900"><RefreshCw className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        }
      >
        {loading ? <div className="text-slate-500">Loading…</div> : filtered.length === 0 ? <div className="py-8 text-center text-slate-400">No transactions</div> : (
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50">
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Account / Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const accountRef = r.receiver_account || r.sender_account || r.txn_reference;
                  return (
                    <TableRow key={r.id} className="border-slate-100 hover:bg-slate-50">
                      <TableCell>
                        <div className="font-bold text-slate-900">{r.profiles?.display_name || r.profiles?.username || "—"}</div>
                        <div className="text-[10px] text-slate-400">{r.profiles?.phone || r.profiles?.email}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold capitalize ${r.type === "deposit" ? "text-emerald-600" : r.type === "withdraw" ? "text-rose-600" : "text-amber-600"}`}>
                          {r.type === "deposit" ? <ArrowDownRight className="h-3 w-3" /> : r.type === "withdraw" ? <ArrowUpRight className="h-3 w-3" /> : null}
                          {r.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-black text-slate-900 tabular-nums">৳{Number(r.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {accountRef ? (
                          <button onClick={() => copyText(String(accountRef))} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700 hover:bg-slate-200" title="Click to copy">
                            <span>{accountRef}</span>
                            <Copy className="h-3 w-3 text-slate-400" />
                          </button>
                        ) : "—"}
                        {r.txn_reference && r.receiver_account && (
                          <div className="mt-0.5 text-[10px] font-mono text-slate-400">Ref: {r.txn_reference}</div>
                        )}
                      </TableCell>
                      <TableCell><StatusPill status={r.status} /></TableCell>
                      <TableCell className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setDetailId(r.id)} className="h-7 border-slate-200" title="Details"><Eye className="h-3 w-3" /></Button>
                          {r.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => { setActionRow({ row: r, nextStatus: "approved" }); setActionNote(""); }} className="h-7 bg-emerald-500 hover:bg-emerald-600 text-white gap-1 px-2 text-xs">
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => { setActionRow({ row: r, nextStatus: "rejected" }); setActionNote(""); }} className="h-7 gap-1 px-2 text-xs">
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <TxnDetailsDialog txnId={detailId} open={!!detailId} onOpenChange={(v) => !v && setDetailId(null)} showUser />
      </Panel>

      {actionRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setActionRow(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900">
              {actionRow.nextStatus === "approved" ? "Approve Transaction" : "Reject Transaction"}
            </h3>
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs space-y-1">
              <div><span className="font-bold text-slate-500">User:</span> {actionRow.row.profiles?.display_name || actionRow.row.profiles?.phone || "User"}</div>
              <div><span className="font-bold text-slate-500">Type:</span> <span className="uppercase font-bold">{actionRow.row.type}</span> · <span className="font-black text-emerald-700">৳{Number(actionRow.row.amount).toLocaleString()}</span></div>
              {(actionRow.row.receiver_account || actionRow.row.sender_account) && (
                <div><span className="font-bold text-slate-500">Account:</span> <span className="font-mono">{actionRow.row.receiver_account || actionRow.row.sender_account}</span></div>
              )}
              {actionRow.row.txn_reference && (
                <div><span className="font-bold text-slate-500">Txn Ref:</span> <span className="font-mono">{actionRow.row.txn_reference}</span></div>
              )}
            </div>
            {actionRow.nextStatus === "rejected" && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["ভুল Txn ID", "পেমেন্ট আসেনি", "টার্নওভার অসম্পূর্ণ", "সঠিক নম্বর দিন"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setActionNote(preset)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Admin Note (Optional)</label>
              <Input value={actionNote} onChange={(e) => setActionNote(e.target.value)} placeholder="মন্তব্য লিখুন…" className="mt-1" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActionRow(null)}>Cancel</Button>
              <Button
                disabled={acting}
                onClick={confirmAction}
                className={actionRow.nextStatus === "approved" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}
              >
                {acting ? "Processing…" : actionRow.nextStatus === "approved" ? "Confirm Approve" : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "admins" | "banned">("all");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ phone: "", displayName: "", password: "", makeAdmin: false });
  const [creating, setCreating] = useState(false);

  // Modals
  const [coinUser, setCoinUser] = useState<any | null>(null);
  const [coinMode, setCoinMode] = useState<"add" | "deduct" | "set">("add");
  const [coinAmount, setCoinAmount] = useState("");
  const [coinNote, setCoinNote] = useState("");
  const [coinBusy, setCoinBusy] = useState(false);

  const [manageUser, setManageUser] = useState<any | null>(null);
  const [manageForm, setManageForm] = useState({ display_name: "", username: "", phone: "", vip_tier: "bronze" });
  const [newPassword, setNewPassword] = useState("");
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [manageBusy, setManageBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const doList = useServerFn(adminListUsers);
  const doAdjust = useServerFn(adminAdjustBalance);
  const doDelete = useServerFn(adminDeleteUser);
  const doCreate = useServerFn(adminCreateUser);
  const doUpdateUser = useServerFn(adminUpdateUser);
  const doResetPw = useServerFn(adminResetUserPassword);
  const doGetDetails = useServerFn(adminGetUserDetails);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doList();
      setUsers(res.rows ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load users");
    } finally {
      setLoading(false);
    }
  }, [doList]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => users.filter((u) => {
    const isAdm = (u.user_roles ?? []).some((r: any) => r.role === "admin");
    if (filterMode === "admins" && !isAdm) return false;
    if (filterMode === "banned" && !u.is_banned) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return [u.display_name, u.username, u.email, u.phone, u.referral_code, u.id].some((v) => v?.toLowerCase().includes(q));
  }), [users, search, filterMode]);

  function openCoins(u: any, defaultMode: "add" | "deduct" | "set" = "add") {
    setCoinUser(u);
    setCoinMode(defaultMode);
    setCoinAmount(defaultMode === "set" ? String(Number(u.wallet_balance ?? 0)) : "");
    setCoinNote("");
  }

  async function submitCoins() {
    if (!coinUser) return;
    const val = Number(coinAmount);
    if (!Number.isFinite(val) || (coinMode !== "set" && val <= 0) || (coinMode === "set" && val < 0)) {
      return toast.error("সঠিক কয়েন/টাকার পরিমাণ দিন");
    }
    setCoinBusy(true);
    try {
      const payload =
        coinMode === "set"
          ? { userId: coinUser.id, amount: val, mode: "set" as const, note: coinNote.trim() || undefined }
          : { userId: coinUser.id, amount: coinMode === "add" ? val : -val, mode: "delta" as const, note: coinNote.trim() || undefined };
      const res = await doAdjust({ data: payload });
      toast.success(`ব্যালেন্স আপডেট হয়েছে → ৳${Number(res.balance).toLocaleString()}`);
      setCoinUser(null);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setCoinBusy(false);
    }
  }

  async function openManage(u: any) {
    setManageUser(u);
    setManageForm({
      display_name: u.display_name ?? "",
      username: u.username ?? "",
      phone: u.phone ?? "",
      vip_tier: u.vip_tier ?? "bronze",
    });
    setNewPassword("");
    setUserDetails(null);
    setDetailsLoading(true);
    try {
      const d = await doGetDetails({ data: { userId: u.id } });
      setUserDetails(d);
    } catch (e: any) {
      setUserDetails(null);
      toast.error(e?.message ?? "User details লোড করা যায়নি");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function saveProfile() {
    if (!manageUser) return;
    setManageBusy(true);
    try {
      await doUpdateUser({
        data: {
          userId: manageUser.id,
          display_name: manageForm.display_name.trim() || null,
          username: manageForm.username.trim() || null,
          phone: manageForm.phone.trim() || null,
          vip_tier: manageForm.vip_tier as any,
        },
      });
      toast.success("অ্যাকাউন্ট আপডেট হয়েছে");
      setManageUser((prev: any) => (prev ? { ...prev, ...manageForm } : prev));
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setManageBusy(false);
    }
  }

  async function resetPw() {
    if (!manageUser) return;
    if (newPassword.length < 6) return toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন");
    setManageBusy(true);
    try {
      await doResetPw({ data: { userId: manageUser.id, password: newPassword } });
      toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে");
      setNewPassword("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setManageBusy(false);
    }
  }

  async function toggleBan(u: any) {
    setManageBusy(true);
    try {
      await doUpdateUser({ data: { userId: u.id, banned: !u.is_banned } });
      toast.success(!u.is_banned ? "অ্যাকাউন্ট ব্যান করা হয়েছে" : "অ্যাকাউন্ট আনব্যান করা হয়েছে");
      setManageUser((prev: any) => (prev && prev.id === u.id ? { ...prev, is_banned: !u.is_banned } : prev));
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setManageBusy(false);
    }
  }

  async function confirmDeleteUser() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await doDelete({ data: { userId: deleteTarget.id } });
      toast.success("User পুরোপুরি ডিলিট হয়েছে");
      setDeleteTarget(null);
      if (manageUser?.id === deleteTarget.id) setManageUser(null);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setDeleting(false);
    }
  }

  async function createUser() {
    const cleanPhone = normalizeBdPhone(createForm.phone);
    if (!phoneRegex.test(cleanPhone)) return toast.error("সঠিক ফোন নাম্বার দিন (01XXXXXXXXX)");
    if (createForm.password.length < 6) return toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের");
    setCreating(true);
    try {
      const res = await doCreate({
        data: {
          phone: cleanPhone,
          displayName: createForm.displayName.trim() || undefined,
          password: createForm.password,
          makeAdmin: createForm.makeAdmin,
        },
      });
      if (!res.success) return toast.error("এই ফোন আগে থেকেই রেজিস্টার্ড");
      toast.success("নতুন ইউজার তৈরি হয়েছে");
      setCreateForm({ phone: "", displayName: "", password: "", makeAdmin: false });
      setShowCreate(false);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setCreating(false);
    }
  }

  async function toggleAdmin(u: any, isAdmin: boolean) {
    if (isAdmin && u.email?.toLowerCase() === "mnpoverseasbd@gmail.com") {
      return toast.error("Main Admin রোল সরানো যাবে না");
    }
    const userId = u.id;
    if (isAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Admin role সরানো হয়েছে");
      adminLogAction({ data: { action: "role.revoke", targetType: "user", targetId: userId, details: { role: "admin" } } }).catch(() => {});
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Admin বানানো হয়েছে");
      adminLogAction({ data: { action: "role.grant", targetType: "user", targetId: userId, details: { role: "admin" } } }).catch(() => {});
    }
    load();
  }

  return (
    <Panel
      title={`Users (${filtered.length})`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(["all", "admins", "banned"] as const).map((m) => (
              <button key={m} onClick={() => setFilterMode(m)} className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition ${filterMode === m ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-900"}`}>{m}</button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search name / phone / email…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-56 border-slate-200 bg-slate-50 pl-8 text-xs" />
          </div>
          <Button size="sm" onClick={() => setShowCreate((s) => !s)} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white gap-1">
            <UserPlus className="h-3.5 w-3.5" /> New User
          </Button>
          <Button size="sm" variant="outline" onClick={load} className="h-9 border-slate-200"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /></Button>
        </div>
      }
    >
      {showCreate && (
        <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-700">নতুন ইউজার তৈরি করুন</div>
          <div className="grid gap-3 sm:grid-cols-5">
            <Input placeholder="Phone (01XXXXXXXXX)" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="border-slate-200 bg-white text-xs" />
            <Input placeholder="Display Name (optional)" value={createForm.displayName} onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })} className="border-slate-200 bg-white text-xs" />
            <Input type="text" placeholder="Password (min 6)" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="border-slate-200 bg-white text-xs" />
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={creating} onClick={createUser} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">{creating ? "…" : "Create"}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)} className="border-slate-200">Cancel</Button>
            </div>
          </div>
          <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
            <input type="checkbox" checked={createForm.makeAdmin} onChange={(e) => setCreateForm({ ...createForm, makeAdmin: e.target.checked })} />
            Admin role দিন
          </label>
        </div>
      )}
      {loading ? <div className="text-slate-500">Loading…</div> : (
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 bg-slate-50">
                <TableHead>User</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Coins / Balance</TableHead>
                <TableHead>VIP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const isAdmin = (u.user_roles ?? []).some((r: any) => r.role === "admin");
                const isMainAdmin = u.email?.toLowerCase() === "mnpoverseasbd@gmail.com";
                return (
                  <TableRow key={u.id} className="border-slate-100 hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 text-xs font-black text-slate-900">
                          {(u.display_name || u.username || "?")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 font-bold text-slate-900">
                            {u.display_name || u.username || "—"}
                            {isAdmin && <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" aria-label="Admin" />}
                            {isMainAdmin && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-700">MAIN</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{u.phone || "—"}</TableCell>
                    <TableCell className="font-black text-emerald-600 tabular-nums">৳{Number(u.wallet_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell><span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600">{u.vip_tier}</span></TableCell>
                    <TableCell>
                      {u.is_banned ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">BANNED</span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">ACTIVE</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => openCoins(u, "add")} className="h-7 bg-emerald-500 hover:bg-emerald-600 text-white gap-1 px-2 text-xs" title="কয়েন দিন/কাটুন">
                          <Coins className="h-3 w-3" /> Coins
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openManage(u)} className="h-7 border-slate-200 gap-1 px-2 text-xs" title="Manage Account">
                          <Settings2 className="h-3 w-3" /> Manage
                        </Button>
                        {!isMainAdmin && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => toggleAdmin(u, isAdmin)} className="h-7 border-slate-200" title={isAdmin ? "Remove admin" : "Make admin"}>
                              {isAdmin ? <ShieldOff className="h-3 w-3 text-indigo-600" /> : <ShieldCheck className="h-3 w-3" />}
                            </Button>
                            <Button size="sm" onClick={() => setDeleteTarget(u)} className="h-7 bg-rose-500 hover:bg-rose-600 text-white" title="Delete">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Coin Adjustment Modal */}
      {coinUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setCoinUser(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">কয়েন / ব্যালেন্স ম্যানেজ</h3>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                Current: ৳{Number(coinUser.wallet_balance).toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">{coinUser.display_name || coinUser.username || coinUser.phone}</div>

            <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
              {[
                { k: "add", label: "+ Add Coins" },
                { k: "deduct", label: "− Deduct" },
                { k: "set", label: "= Set Exact" },
              ].map((m) => (
                <button
                  key={m.k}
                  type="button"
                  onClick={() => {
                    setCoinMode(m.k as any);
                    if (m.k === "set") setCoinAmount(String(Number(coinUser.wallet_balance ?? 0)));
                  }}
                  className={`rounded-lg py-2 text-xs font-bold transition ${coinMode === m.k ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-900"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {[100, 500, 1000, 5000, 10000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCoinAmount(String(preset))}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300"
                >
                  ৳{preset.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {coinMode === "set" ? "New Exact Balance (৳)" : "Amount (৳)"}
                </label>
                <Input type="number" value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} placeholder="500" className="mt-1 text-base font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason / Note (optional)</label>
                <Input value={coinNote} onChange={(e) => setCoinNote(e.target.value)} placeholder="e.g. Manual top-up / VIP bonus" className="mt-1 text-xs" />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCoinUser(null)}>Cancel</Button>
              <Button disabled={coinBusy} onClick={submitCoins} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {coinBusy ? "Saving…" : "Update Balance"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Account Management Modal */}
      {manageUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto backdrop-blur-sm" onClick={() => setManageUser(null)}>
          <div className="my-8 w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Manage Account — {manageUser.display_name || manageUser.phone}</h3>
                <div className="text-xs text-slate-500 font-mono">{manageUser.id}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => openCoins(manageUser, "add")} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                  <Coins className="h-3.5 w-3.5" /> ৳{Number(manageUser.wallet_balance).toLocaleString()}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={manageBusy}
                  onClick={() => toggleBan(manageUser)}
                  className={manageUser.is_banned ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}
                >
                  <Ban className="h-3.5 w-3.5 mr-1" /> {manageUser.is_banned ? "Unban" : "Ban User"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(manageUser)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-black uppercase tracking-wider text-slate-600">Profile &amp; VIP</div>
                <div className="grid gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Display Name</label>
                    <Input value={manageForm.display_name} onChange={(e) => setManageForm({ ...manageForm, display_name: e.target.value })} className="mt-1 h-9 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Username</label>
                    <Input value={manageForm.username} onChange={(e) => setManageForm({ ...manageForm, username: e.target.value })} className="mt-1 h-9 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Phone</label>
                      <Input value={manageForm.phone} onChange={(e) => setManageForm({ ...manageForm, phone: e.target.value })} className="mt-1 h-9 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">VIP Tier</label>
                      <select
                        value={manageForm.vip_tier}
                        onChange={(e) => setManageForm({ ...manageForm, vip_tier: e.target.value })}
                        className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-bold uppercase"
                      >
                        {["bronze", "silver", "gold", "platinum", "diamond"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button size="sm" disabled={manageBusy} onClick={saveProfile} className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                    Save Profile
                  </Button>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-black uppercase tracking-wider text-slate-600">Security &amp; Summary</div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Reset Password</label>
                  <div className="mt-1 flex gap-2">
                    <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6)" className="h-9 text-xs" />
                    <Button size="sm" disabled={manageBusy} onClick={resetPw} className="h-9 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                      <KeyRound className="h-3.5 w-3.5 mr-1" /> Set
                    </Button>
                  </div>
                  {userDetails?.authEmail && (
                    <div className="mt-1.5 text-[11px] text-slate-500">
                      Login Email / ID: <span className="font-mono font-semibold text-slate-700">{userDetails.authEmail}</span>
                    </div>
                  )}
                </div>
                {detailsLoading ? (
                  <div className="py-4 text-xs text-slate-400">Loading activity…</div>
                ) : userDetails?.summary && (
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="rounded-xl bg-emerald-50 p-2.5">
                      <div className="text-[10px] font-bold text-emerald-700">Deposits</div>
                      <div className="font-black text-emerald-800">৳{userDetails.summary.deposits.toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl bg-rose-50 p-2.5">
                      <div className="text-[10px] font-bold text-rose-700">Withdraws</div>
                      <div className="font-black text-rose-800">৳{userDetails.summary.withdraws.toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl bg-indigo-50 p-2.5">
                      <div className="text-[10px] font-bold text-indigo-700">Total Wagered</div>
                      <div className="font-black text-indigo-800">৳{userDetails.summary.bets.toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-2.5">
                      <div className="text-[10px] font-bold text-amber-700">Total Won</div>
                      <div className="font-black text-amber-800">৳{userDetails.summary.wins.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <div className="mb-2 text-xs font-black uppercase tracking-wider text-slate-600">Recent Transactions &amp; Bets</div>
              <div className="max-h-56 overflow-y-auto">
                {detailsLoading ? (
                  <div className="text-xs text-slate-400">Loading…</div>
                ) : !(userDetails?.transactions?.length) ? (
                  <div className="text-xs text-slate-400 py-4 text-center">No recent activity</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px]">Type</TableHead>
                        <TableHead className="text-[10px]">Game / Note</TableHead>
                        <TableHead className="text-[10px]">Status</TableHead>
                        <TableHead className="text-[10px] text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetails.transactions.map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell className="text-xs font-bold uppercase">{t.type}</TableCell>
                          <TableCell className="text-xs text-slate-500">{t.game_id || t.admin_note || t.txn_reference || "—"}</TableCell>
                          <TableCell><StatusPill status={t.status} /></TableCell>
                          <TableCell className="text-right text-xs font-black">৳{Number(t.amount).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setManageUser(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-rose-600">Delete Account?</h3>
            <p className="mt-2 text-xs text-slate-600">
              আপনি কি নিশ্চিত <span className="font-bold text-slate-900">{deleteTarget.display_name || deleteTarget.phone || deleteTarget.email}</span>-কে পুরোপুরি ডিলিট করবেন? এটি আর ফেরানো যাবে না।
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" disabled={deleting} onClick={confirmDeleteUser}>
                {deleting ? "Deleting…" : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}


function AdminMethods() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ kind: "bkash"|"nagad"|"rocket"|"bank"|"usdt"|"other"; label: string; account_number: string; instructions: string; min_deposit: number; min_withdraw: number }>({ kind: "bkash", label: "", account_number: "", instructions: "", min_deposit: 300, min_withdraw: 500 });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("payment_methods").select("*").order("created_at");
    setRows(data ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!form.label || !form.account_number) return toast.error("Label এবং Account Number দিন");
    const { error } = await supabase.from("payment_methods").insert(form);
    if (error) return toast.error(error.message);
    toast.success("যোগ হয়েছে");
    setForm({ ...form, label: "", account_number: "", instructions: "" });
    load();
  }
  async function toggleActive(id: string, is_active: boolean) {
    await supabase.from("payment_methods").update({ is_active: !is_active }).eq("id", id);
    load();
  }
  async function remove(id: string) {
    if (!confirm("ডিলিট করবেন?")) return;
    await supabase.from("payment_methods").delete().eq("id", id);
    load();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Panel title="New Payment Method">
          <div className="grid gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kind</label>
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900">
                {["bkash", "nagad", "rocket", "bank", "usdt", "other"].map((k) => <option key={k} value={k} className="bg-black">{k}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Label</label>
              <Input placeholder="e.g. bKash Personal" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="mt-1 border-slate-200 bg-slate-50" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Number</label>
              <Input placeholder="017…" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} className="mt-1 border-slate-200 bg-slate-50" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Instructions</label>
              <Input placeholder="Send Money, then submit ref" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="mt-1 border-slate-200 bg-slate-50" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Min Deposit</label>
                <Input type="number" value={form.min_deposit} onChange={(e) => setForm({ ...form, min_deposit: Number(e.target.value) })} className="mt-1 border-slate-200 bg-slate-50" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Min Withdraw</label>
                <Input type="number" value={form.min_withdraw} onChange={(e) => setForm({ ...form, min_withdraw: Number(e.target.value) })} className="mt-1 border-slate-200 bg-slate-50" />
              </div>
            </div>
            <Button onClick={add} className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-black font-black">+ Add Method</Button>
          </div>
        </Panel>
      </div>
      <div className="lg:col-span-3">
        <Panel title="Active Methods">
          {loading ? <div className="text-slate-500">Loading…</div> : rows.length === 0 ? <div className="py-8 text-center text-slate-400">No methods yet</div> : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-[10px] font-black uppercase ${r.is_active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>{r.kind.slice(0,4)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900">{r.label}</div>
                    <div className="text-xs font-mono text-slate-400">{r.account_number}</div>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <div>Min D: ৳{r.min_deposit}</div>
                    <div>Min W: ৳{r.min_withdraw}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(r.id, r.is_active)} className="h-7 border-slate-200 text-xs">{r.is_active ? "Disable" : "Enable"}</Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(r.id)} className="h-7 text-xs">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function AdminGames() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ game_key: "", name: "", min_bet: 10, max_bet: 10000 });

  const doSync = useServerFn(adminSyncAllGames);
  const doUpsert = useServerFn(adminUpsertGameConfig);
  const doBulk = useServerFn(adminBulkUpdateGames);
  const doDeleteGame = useServerFn(adminDeleteGameConfig);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("game_configs").select("*").order("name");
    setRows(data ?? []);
    setEdits({});
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function setField(id: string, field: string, value: any) {
    setEdits((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: value } }));
  }
  function valOf(r: any, field: string) {
    if (edits[r.id]?.[field] !== undefined) return edits[r.id][field];
    if (field === "win_rate_pct") return Number(r.config?.win_rate_pct ?? 50);
    if (field === "payout_multiplier") return Number(r.config?.payout_multiplier ?? 1);
    if (field === "max_payout_mult") return Number(r.config?.max_payout_mult ?? 0);
    return r[field];
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter === "enabled" && !r.is_enabled) return false;
      if (statusFilter === "disabled" && r.is_enabled) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.game_key.toLowerCase().includes(q);
    });
  }, [rows, search, statusFilter]);

  async function syncAll() {
    setSyncing(true);
    try {
      const res = await doSync();
      toast.success(`Synced! ${res.inserted}টি নতুন গেম যোগ হয়েছে (মোট ${res.total})`);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function save(r: any) {
    const patch = edits[r.id];
    if (!patch) return toast.info("কোনো পরিবর্তন নেই");
    const min = Number(patch.min_bet ?? r.min_bet);
    const max = Number(patch.max_bet ?? r.max_bet);
    if (!Number.isFinite(min) || min < 0) return toast.error("Min Bet ০ বা তার বেশি হতে হবে");
    if (!Number.isFinite(max) || max <= 0) return toast.error("Max Bet ০ এর বেশি হতে হবে");
    if (min > max) return toast.error("Min Bet, Max Bet এর চেয়ে বড় হতে পারবে না");
    try {
      await doUpsert({
        data: {
          id: r.id,
          game_key: r.game_key,
          name: r.name,
          is_enabled: r.is_enabled,
          min_bet: min,
          max_bet: max,
        },
      });
      toast.success(`${r.name} আপডেট হয়েছে`);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    }
  }

  async function toggleEnabled(r: any) {
    try {
      await doUpsert({
        data: {
          id: r.id,
          game_key: r.game_key,
          name: r.name,
          is_enabled: !r.is_enabled,
          min_bet: Number(r.min_bet),
          max_bet: Number(r.max_bet),
        },
      });
      toast.success(`${r.name} ${!r.is_enabled ? "ON" : "OFF"}`);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  async function applyBulk(opts: { is_enabled?: boolean }) {
    if (!filtered.length) return;
    setBulkBusy(true);
    try {
      const res = await doBulk({
        data: {
          gameKeys: filtered.map((r) => r.game_key),
          ...opts,
        },
      });
      toast.success(`${res.updated}টি গেম একসাথে আপডেট হয়েছে`);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  }

  async function createGame() {
    if (!addForm.game_key.trim() || !addForm.name.trim()) return toast.error("Game Key এবং Name দিন");
    try {
      await doUpsert({
        data: {
          game_key: addForm.game_key.trim().toLowerCase(),
          name: addForm.name.trim(),
          is_enabled: true,
          min_bet: Number(addForm.min_bet),
          max_bet: Number(addForm.max_bet),
        },
      });
      toast.success("নতুন গেম যোগ হয়েছে");
      setShowAdd(false);
      setAddForm({ game_key: "", name: "", min_bet: 10, max_bet: 10000 });
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  async function removeGame(r: any) {
    if (!confirm(`Delete config for "${r.name}"?`)) return;
    try {
      await doDeleteGame({ data: { id: r.id } });
      toast.success("Deleted");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <Panel
        title={`Game Controls (${filtered.length}/${rows.length})`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search game…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-44 border-slate-200 bg-slate-50 pl-8 text-xs" />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(["all", "enabled", "disabled"] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${statusFilter === s ? "bg-emerald-600 text-white" : "text-slate-500"}`}>{s}</button>
              ))}
            </div>
            <Button size="sm" onClick={syncAll} disabled={syncing} className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1">
              <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} /> Sync All 42 Games
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd((v) => !v)} className="h-8 border-slate-200 text-xs gap-1">
              <Plus className="h-3 w-3" /> Add Game
            </Button>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <span>Win odds and payout settings are locked pending verified settlement.</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => applyBulk({ is_enabled: true })} className="h-8 border-emerald-300 text-emerald-700 text-[11px] font-bold">Enable All</Button>
            <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => applyBulk({ is_enabled: false })} className="h-8 border-rose-300 text-rose-700 text-[11px] font-bold">Disable All</Button>
          </div>
        </div>

        {showAdd && (
          <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-700">Add / Register Game Config</div>
            <div className="grid gap-2 sm:grid-cols-5">
              <Input placeholder="game_key (e.g. crash)" value={addForm.game_key} onChange={(e) => setAddForm({ ...addForm, game_key: e.target.value })} className="bg-white text-xs" />
              <Input placeholder="Display Name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="bg-white text-xs" />
              <Input type="number" placeholder="Min Bet" value={addForm.min_bet} onChange={(e) => setAddForm({ ...addForm, min_bet: Number(e.target.value) })} className="bg-white text-xs" />
              <Input type="number" placeholder="Max Bet" value={addForm.max_bet} onChange={(e) => setAddForm({ ...addForm, max_bet: Number(e.target.value) })} className="bg-white text-xs" />
              <div className="flex gap-2">
                <Button size="sm" onClick={createGame} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
                <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        <ThumbnailDuplicateReport />
        {loading ? <div className="text-slate-500">Loading…</div> : filtered.length === 0 ? <div className="py-8 text-center text-slate-400">No games found — click &ldquo;Sync All 42 Games&rdquo;</div> : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r) => {
              const dirty = !!edits[r.id];
              const wr = Number(valOf(r, "win_rate_pct"));
              const wrTone = wr < 40 ? "text-rose-600 bg-rose-50" : wr > 55 ? "text-emerald-600 bg-emerald-50" : "text-amber-700 bg-amber-50";
              return (
                <div key={r.id} className={`rounded-2xl border p-4 transition ${dirty ? "border-indigo-300 bg-indigo-50/30 shadow-sm" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-base font-black text-slate-900">{r.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-slate-400">
                        <span>{r.game_key}</span>
                        <a href={`/games/${r.game_key}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-indigo-600 hover:underline">
                          Open <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleEnabled(r)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${r.is_enabled ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-rose-300 bg-rose-100 text-rose-700"}`}
                      >
                        {r.is_enabled ? "● ON" : "○ OFF"}
                      </button>
                      <button onClick={() => removeGame(r)} className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete config">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Win Rate · locked</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${wrTone}`}>{wr}%</span>
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-500">Game wagering is paused until wins can be verified securely.</p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Min Bet (৳)</label>
                      <Input type="number" value={valOf(r, "min_bet")} onChange={(e) => setField(r.id, "min_bet", Number(e.target.value))} className="mt-1 h-8 border-slate-200 bg-white text-xs" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Max Bet (৳)</label>
                      <Input type="number" value={valOf(r, "max_bet")} onChange={(e) => setField(r.id, "max_bet", Number(e.target.value))} className="mt-1 h-8 border-slate-200 bg-white text-xs" />
                    </div>
                  </div>
                  <Button size="sm" onClick={() => save(r)} disabled={!dirty} className={`mt-3 w-full font-black ${dirty ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {dirty ? "Save Changes" : "Saved"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

function AdminVipTiers() {
  const [rows, setRows] = useState<any[]>([]);
  const [dirty, setDirty] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const listTierConfigs = useServerFn(adminListVipTierConfigs);
  const updateTierConfig = useServerFn(adminUpdateVipTierConfig);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { rows } = await listTierConfigs();
      setRows(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load VIP tiers");
      setRows([]);
    } finally {
      setDirty({});
      setLoading(false);
    }
  }, [listTierConfigs]);

  useEffect(() => { load(); }, [load]);

  const setField = (id: string, key: string, value: number) => {
    setDirty((d) => ({ ...d, [id]: { ...(d[id] ?? {}), [key]: value } }));
  };
  const valOf = (r: any, key: string) => dirty[r.id]?.[key] ?? r[key];
  const isDirty = (id: string) => !!dirty[id];

  const save = async (r: any) => {
    if (!isDirty(r.id)) return;
    setSaving(r.id);
    const patch = dirty[r.id];
    try {
      await updateTierConfig({ data: { id: r.id, patch } });
      toast.success(`${r.tier.toUpperCase()} tier updated`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update VIP tier");
    } finally {
      setSaving(null);
    }
  };

  const tierColor: Record<string, string> = {
    bronze: "from-amber-700 to-amber-500",
    silver: "from-slate-400 to-slate-300",
    gold: "from-yellow-500 to-amber-400",
    platinum: "from-cyan-400 to-blue-400",
    diamond: "from-fuchsia-500 to-indigo-500",
  };

  const runPayouts = useServerFn(adminRunVipPayouts);
  const previewPayouts = useServerFn(adminPreviewVipPayouts);
  const [running, setRunning] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [lastRun, setLastRun] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [confirmRun, setConfirmRun] = useState(false);

  const doPreview = async () => {
    setPreviewing(true);
    setLastRun(null);
    try {
      const res: any = await previewPayouts();
      setPreview(res);
      toast.success(
        `Dry-run: D ${res.daily.users}u/৳${res.daily.total} • W ${res.weekly.users}u/৳${res.weekly.total} • C ${res.cashback.users}u/৳${res.cashback.total}`,
      );
    } catch (e: any) {
      toast.error(e?.message || "Preview failed");
    } finally {
      setPreviewing(false);
    }
  };

  const triggerNow = async () => {
    if (!confirmRun) {
      setConfirmRun(true);
      setTimeout(() => setConfirmRun(false), 4000);
      return;
    }
    setConfirmRun(false);
    setRunning(true);
    try {
      const res: any = await runPayouts();
      setLastRun(res);
      setPreview(null);
      const d = res.daily, w = res.weekly, c = res.cashback;
      toast.success(`Payouts done — Daily: ${d.credited_users}u/৳${d.total_amount} • Weekly: ${w.credited_users}u/৳${w.total_amount} • Cashback: ${c.credited_users}u/৳${c.total_amount}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Panel title="VIP Tier Configuration">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">Deposit করা টাকার total এর ভিত্তিতে ইউজার এই tier-এ auto upgrade হবে।</div>
        <div className="flex items-center gap-2">
          {lastRun && (
            <div className="text-[10px] font-semibold text-slate-500">
              Last: D {lastRun.daily.credited_users}/৳{lastRun.daily.total_amount} • W {lastRun.weekly.credited_users}/৳{lastRun.weekly.total_amount} • C {lastRun.cashback.credited_users}/৳{lastRun.cashback.total_amount}
            </div>
          )}
          <Button size="sm" variant="outline" onClick={doPreview} disabled={previewing || running} className="font-bold">
            <Eye className={`h-3.5 w-3.5 mr-1.5 ${previewing ? "animate-pulse" : ""}`} />
            {previewing ? "Estimating…" : "Dry Run"}
          </Button>
          <Button size="sm" onClick={triggerNow} disabled={running || previewing} className={`font-black text-white ${confirmRun ? "bg-rose-500 hover:bg-rose-600" : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90"}`}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${running ? "animate-spin" : ""}`} />
            {running ? "Running…" : confirmRun ? "Click again to confirm" : "Run VIP Payouts Now"}
          </Button>
        </div>
      </div>

      {preview && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-black uppercase tracking-widest text-amber-700">
              Dry-run estimate · no wallets touched
            </div>
            <button onClick={() => setPreview(null)} className="text-[10px] font-bold text-amber-600 hover:text-amber-800">
              Dismiss
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["daily", "weekly", "cashback"] as const).map((k) => {
              const p = preview[k];
              const colors: Record<string, string> = {
                daily: "from-emerald-500 to-teal-500",
                weekly: "from-indigo-500 to-blue-500",
                cashback: "from-amber-500 to-orange-500",
              };
              return (
                <div key={k} className="rounded-xl bg-white border border-slate-200 p-3">
                  <div className={`inline-flex rounded-md bg-gradient-to-br ${colors[k]} px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white`}>
                    {k}
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-800">৳{Number(p.total).toLocaleString()}</div>
                  <div className="text-[11px] font-semibold text-slate-500">{p.users} user{p.users === 1 ? "" : "s"} eligible</div>
                  {p.entries.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto text-[11px] text-slate-600 space-y-0.5">
                      {p.entries.slice(0, 20).map((e: any, i: number) => (
                        <div key={i} className="flex justify-between gap-2 border-b border-slate-100 py-1 last:border-0">
                          <span className="truncate">{e.display}{e.tier ? ` · ${e.tier}` : ""}</span>
                          <span className="font-bold text-emerald-600">৳{Number(e.amount).toLocaleString()}</span>
                        </div>
                      ))}
                      {p.entries.length > 20 && (
                        <div className="text-[10px] text-slate-400 pt-1">+{p.entries.length - 20} more…</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {loading ? (
        <div className="p-6 text-center text-sm text-slate-400">Loading tiers…</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((r) => {
            const d = isDirty(r.id);
            const color = tierColor[r.tier] ?? "from-slate-500 to-slate-400";
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-br ${color} px-4 py-2 text-white shadow-md`}>
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-sm font-black uppercase tracking-widest">{r.tier}</span>
                  </div>
                  {d && <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Unsaved</span>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Min Total Deposit (৳)">
                    <Input type="number" value={valOf(r, "min_deposit_total")} onChange={(e) => setField(r.id, "min_deposit_total", Number(e.target.value))} className="h-9 border-slate-200 bg-white text-xs" />
                  </Field>
                  <Field label="Cashback %">
                    <Input type="number" step="0.1" value={valOf(r, "cashback_pct")} onChange={(e) => setField(r.id, "cashback_pct", Number(e.target.value))} className="h-9 border-slate-200 bg-white text-xs" />
                  </Field>
                  <Field label="Daily Bonus (৳)">
                    <Input type="number" value={valOf(r, "daily_bonus")} onChange={(e) => setField(r.id, "daily_bonus", Number(e.target.value))} className="h-9 border-slate-200 bg-white text-xs" />
                  </Field>
                  <Field label="Weekly Bonus (৳)">
                    <Input type="number" value={valOf(r, "weekly_bonus")} onChange={(e) => setField(r.id, "weekly_bonus", Number(e.target.value))} className="h-9 border-slate-200 bg-white text-xs" />
                  </Field>
                  <Field label="Min Deposit (৳)">
                    <Input type="number" value={valOf(r, "min_deposit_amount")} onChange={(e) => setField(r.id, "min_deposit_amount", Number(e.target.value))} className="h-9 border-slate-200 bg-white text-xs" />
                  </Field>
                  <Field label="Max Deposit (৳)">
                    <Input type="number" value={valOf(r, "max_deposit_amount")} onChange={(e) => setField(r.id, "max_deposit_amount", Number(e.target.value))} className="h-9 border-slate-200 bg-white text-xs" />
                  </Field>
                  <Field label="Min Withdraw (৳)">
                    <Input type="number" value={valOf(r, "min_withdraw_amount")} onChange={(e) => setField(r.id, "min_withdraw_amount", Number(e.target.value))} className="h-9 border-slate-200 bg-white text-xs" />
                  </Field>
                  <Field label="Max Withdraw (৳)">
                    <Input type="number" value={valOf(r, "max_withdraw_amount")} onChange={(e) => setField(r.id, "max_withdraw_amount", Number(e.target.value))} className="h-9 border-slate-200 bg-white text-xs" />
                  </Field>
                </div>

                <Button size="sm" onClick={() => save(r)} disabled={!d || saving === r.id} className={`mt-4 w-full font-black ${d ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-slate-50 text-slate-300"}`}>
                  {saving === r.id ? "Saving…" : d ? "Save Changes" : "No Changes"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

type VipRun = {
  key: string;
  runAt: string;
  category: "daily" | "weekly" | "cashback";
  users: number;
  total: number;
  entries: { user_id: string; amount: number; approved_at: string; admin_note: string | null; display: string }[];
};

function categorize(note: string | null): VipRun["category"] | null {
  if (!note) return null;
  const n = note.toLowerCase();
  if (n.includes("vip daily bonus")) return "daily";
  if (n.includes("vip weekly bonus")) return "weekly";
  if (n.includes("vip cashback")) return "cashback";
  return null;
}

function AdminVipHistory() {
  const [runs, setRuns] = useState<VipRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [days, setDays] = useState(14);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    const { data: txns, error } = await supabase
      .from("transactions")
      .select("user_id, amount, approved_at, admin_note, type")
      .in("type", ["bonus", "cashback"])
      .eq("status", "approved")
      .gte("approved_at", since)
      .order("approved_at", { ascending: false })
      .limit(1000);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const filtered = (txns ?? []).filter((t) => categorize(t.admin_note));
    const userIds = Array.from(new Set(filtered.map((t) => t.user_id)));
    let nameMap = new Map<string, string>();
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, username, phone")
        .in("id", userIds);
      (profs ?? []).forEach((p: any) =>
        nameMap.set(p.id, p.display_name || p.username || p.phone || p.id.slice(0, 8)),
      );
    }
    const bucket = new Map<string, VipRun>();
    for (const t of filtered) {
      const cat = categorize(t.admin_note)!;
      const date = (t.approved_at ?? "").slice(0, 10);
      const key = `${date}::${cat}`;
      let r = bucket.get(key);
      if (!r) {
        r = { key, runAt: t.approved_at!, category: cat, users: 0, total: 0, entries: [] };
        bucket.set(key, r);
      }
      r.entries.push({
        user_id: t.user_id,
        amount: Number(t.amount),
        approved_at: t.approved_at!,
        admin_note: t.admin_note,
        display: nameMap.get(t.user_id) || t.user_id.slice(0, 8),
      });
      r.total += Number(t.amount);
      if (t.approved_at! > r.runAt) r.runAt = t.approved_at!;
    }
    bucket.forEach((r) => (r.users = new Set(r.entries.map((e) => e.user_id)).size));
    setRuns(Array.from(bucket.values()).sort((a, b) => (a.runAt < b.runAt ? 1 : -1)));
    setLoading(false);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const catColor: Record<VipRun["category"], string> = {
    daily: "from-emerald-500 to-teal-500",
    weekly: "from-indigo-500 to-blue-500",
    cashback: "from-amber-500 to-orange-500",
  };

  return (
    <Panel
      title="VIP Payout History"
      action={
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button size="sm" variant="outline" onClick={load} className="h-8">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="p-6 text-center text-sm text-slate-400">Loading history…</div>
      ) : runs.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          No VIP payouts in the selected period. Run the cron manually from the VIP Tier panel to test.
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((r) => {
            const isOpen = openKey === r.key;
            return (
              <div key={r.key} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  onClick={() => setOpenKey(isOpen ? null : r.key)}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 transition text-left"
                >
                  <span
                    className={`inline-flex rounded-lg bg-gradient-to-br ${catColor[r.category]} px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm`}
                  >
                    {r.category}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-800">
                      {new Date(r.runAt).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {r.users} user{r.users === 1 ? "" : "s"} credited
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-600">
                      ৳{r.total.toLocaleString()}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400">total</div>
                  </div>
                  <span className="ml-2 text-slate-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-3">
                    <div className="max-h-72 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px]">User</TableHead>
                            <TableHead className="text-[10px]">Note</TableHead>
                            <TableHead className="text-[10px]">Time</TableHead>
                            <TableHead className="text-[10px] text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {r.entries
                            .sort((a, b) => (a.approved_at < b.approved_at ? 1 : -1))
                            .map((e, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-xs font-semibold text-slate-700">
                                  {e.display}
                                </TableCell>
                                <TableCell className="text-[11px] text-slate-500">
                                  {e.admin_note}
                                </TableCell>
                                <TableCell className="text-[11px] text-slate-500">
                                  {new Date(e.approved_at).toLocaleTimeString()}
                                </TableCell>
                                <TableCell className="text-right text-xs font-black text-emerald-600">
                                  ৳{e.amount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function AdminAuditLogs() {
  const listLogs = useServerFn(adminListAuditLogs);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [limit, setLimit] = useState<number>(100);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLogs({ data: { limit, action: actionFilter || undefined } });
      setRows(res.rows);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [listLogs, limit, actionFilter]);

  useEffect(() => { load(); }, [load]);

  const actionColor = (a: string) => {
    if (a.startsWith("txn.approved")) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    if (a.startsWith("txn.rejected")) return "bg-rose-50 text-rose-700 ring-rose-200";
    if (a.startsWith("user.delete")) return "bg-rose-50 text-rose-700 ring-rose-200";
    if (a.startsWith("user.create")) return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    if (a.startsWith("role.")) return "bg-violet-50 text-violet-700 ring-violet-200";
    if (a.startsWith("wallet.")) return "bg-amber-50 text-amber-700 ring-amber-200";
    if (a.startsWith("vip.")) return "bg-yellow-50 text-yellow-800 ring-yellow-200";
    return "bg-slate-100 text-slate-700 ring-slate-200";
  };

  return (
    <Panel
      title={`Audit Logs (${rows.length})`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter action (e.g. txn.approved)"
            className="h-8 w-56 text-xs"
          />
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
          </select>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-8">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Time</TableHead>
              <TableHead className="w-40">Actor</TableHead>
              <TableHead className="w-48">Action</TableHead>
              <TableHead className="w-56">Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                  {loading ? "Loading…" : "No audit entries yet"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-slate-600">
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-800">
                    {r.actor_label || (r.actor_id ? r.actor_id.slice(0, 8) : "system")}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${actionColor(r.action)}`}>
                      {r.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {r.target_type ? (
                      <>
                        <span className="text-slate-400">{r.target_type}:</span>{" "}
                        <span className="font-mono">{r.target_id ? String(r.target_id).slice(0, 12) : "—"}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <pre className="max-w-md overflow-hidden truncate whitespace-pre-wrap break-all text-[10px] text-slate-500">
                      {r.details && Object.keys(r.details).length ? JSON.stringify(r.details) : "—"}
                    </pre>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}

function AdminFeatureFlags() {
  const listFlags = useServerFn(adminListFeatureFlags);
  const upsertFlag = useServerFn(adminUpsertFeatureFlag);
  const deleteFlag = useServerFn(adminDeleteFeatureFlag);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ flag_key: "", enabled: true, description: "" });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listFlags({ data: undefined as any });
      setRows(res.rows);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load flags");
    } finally {
      setLoading(false);
    }
  }, [listFlags]);

  useEffect(() => { load(); }, [load]);

  async function toggle(row: any) {
    setBusy(row.flag_key);
    try {
      await upsertFlag({ data: { flag_key: row.flag_key, enabled: !row.enabled, description: row.description, metadata: row.metadata ?? {} } });
      toast.success(`${row.flag_key} → ${!row.enabled ? "ON" : "OFF"}`);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Toggle failed");
    } finally {
      setBusy(null);
    }
  }

  async function create() {
    if (!form.flag_key.trim()) return toast.error("flag_key দিন");
    setCreating(true);
    try {
      await upsertFlag({ data: { flag_key: form.flag_key.trim(), enabled: form.enabled, description: form.description.trim() || null, metadata: {} } });
      toast.success("Flag সেভ হয়েছে");
      setForm({ flag_key: "", enabled: true, description: "" });
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setCreating(false);
    }
  }

  async function remove(key: string) {
    if (!confirm(`Delete flag "${key}"?`)) return;
    setBusy(key);
    try {
      await deleteFlag({ data: { flag_key: key } });
      toast.success("Deleted");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <Panel title="নতুন Flag যোগ করুন">
        <div className="grid gap-3 sm:grid-cols-[1fr,1fr,auto,auto]">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">flag_key</label>
            <Input value={form.flag_key} onChange={(e) => setForm((f) => ({ ...f, flag_key: e.target.value }))} placeholder="e.g. hero_promo_banner" className="h-9 mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">description</label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" className="h-9 mt-1" />
          </div>
          <div className="flex items-end">
            <label className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
              Enabled
            </label>
          </div>
          <div className="flex items-end">
            <Button onClick={create} disabled={creating} className="h-9 bg-gradient-to-r from-cyan-500 to-sky-600 text-white">
              {creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} সেভ / আপডেট
            </Button>
          </div>
        </div>
      </Panel>

      <Panel
        title={`Feature Flags (${rows.length})`}
        action={
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-8">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-40">Updated</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                    {loading ? "Loading…" : "কোনো flag নেই — উপরে থেকে যোগ করুন"}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-2"><Flag className="h-3 w-3 text-cyan-600" />{r.flag_key}</span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggle(r)}
                        disabled={busy === r.flag_key}
                        className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${r.enabled ? "bg-emerald-500" : "bg-slate-300"} ${busy === r.flag_key ? "opacity-50" : ""}`}
                      >
                        <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${r.enabled ? "translate-x-5" : ""}`} />
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{r.description || "—"}</TableCell>
                    <TableCell className="text-xs text-slate-500">{new Date(r.updated_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => remove(r.flag_key)} disabled={busy === r.flag_key} className="h-7 text-rose-600 hover:bg-rose-50">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}

function AdminReports() {
  const run = useServerFn(adminReports);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await run({ data: { days } });
      setData(res);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [run, days]);

  useEffect(() => { load(); }, [load]);

  const maxDeposit = useMemo(() => {
    if (!data?.series?.length) return 1;
    return Math.max(1, ...data.series.map((s: any) => Math.max(s.deposits, s.withdrawals, s.bets, s.wins)));
  }, [data]);

  const fmt = (n: number) => `৳ ${Math.round(n).toLocaleString("en-BD")}`;

  return (
    <div className="space-y-4">
      <Panel
        title="Time Window"
        action={
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
            >
              {[7, 14, 30, 60, 90].map((d) => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
            <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-8">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <ReportStat label="Deposits" value={fmt(data?.totals?.deposits ?? 0)} tone="emerald" />
          <ReportStat label="Withdrawals" value={fmt(data?.totals?.withdrawals ?? 0)} tone="rose" />
          <ReportStat label="Bets" value={fmt(data?.totals?.bets ?? 0)} tone="indigo" />
          <ReportStat label="Wins" value={fmt(data?.totals?.wins ?? 0)} tone="amber" />
          <ReportStat label="GGR" value={fmt(data?.totals?.ggr ?? 0)} tone="fuchsia" />
          <ReportStat label="New Users" value={String(data?.totals?.new_users ?? 0)} tone="cyan" />
        </div>
      </Panel>

      <Panel title="Daily Series">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead className="text-right">Deposits</TableHead>
                <TableHead className="text-right">Withdrawals</TableHead>
                <TableHead className="text-right">Bets</TableHead>
                <TableHead className="text-right">Wins</TableHead>
                <TableHead className="text-right">GGR</TableHead>
                <TableHead className="text-right">New Users</TableHead>
                <TableHead className="w-40">Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.series ?? []).slice().reverse().map((d: any) => (
                <TableRow key={d.day}>
                  <TableCell className="text-xs font-medium">{d.day}</TableCell>
                  <TableCell className="text-right text-xs text-emerald-700">{fmt(d.deposits)}</TableCell>
                  <TableCell className="text-right text-xs text-rose-700">{fmt(d.withdrawals)}</TableCell>
                  <TableCell className="text-right text-xs text-indigo-700">{fmt(d.bets)}</TableCell>
                  <TableCell className="text-right text-xs text-amber-700">{fmt(d.wins)}</TableCell>
                  <TableCell className={`text-right text-xs font-semibold ${d.ggr >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmt(d.ggr)}</TableCell>
                  <TableCell className="text-right text-xs">{d.new_users}</TableCell>
                  <TableCell>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" style={{ width: `${Math.min(100, (Math.max(d.deposits, d.bets) / maxDeposit) * 100)}%` }} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!data?.series?.length) && (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-sm text-slate-500">
                    {loading ? "Loading…" : "No activity in this window"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top Depositors">
          <TopTable rows={data?.top_depositors ?? []} loading={loading} label="Deposited" />
        </Panel>
        <Panel title="Top Wagerers">
          <TopTable rows={data?.top_wagerers ?? []} loading={loading} label="Wagered" />
        </Panel>
      </div>
    </div>
  );
}

function ReportStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "from-emerald-500 to-teal-500",
    rose: "from-rose-500 to-pink-500",
    indigo: "from-indigo-500 to-blue-500",
    amber: "from-amber-500 to-orange-500",
    fuchsia: "from-fuchsia-500 to-pink-600",
    cyan: "from-cyan-500 to-sky-500",
  };
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 bg-gradient-to-r ${tones[tone] ?? tones.indigo} bg-clip-text text-lg font-black text-transparent`}>{value}</div>
    </div>
  );
}

function TopTable({ rows, loading, label }: { rows: { display: string; amount: number; user_id: string }[]; loading: boolean; label: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">#</TableHead>
          <TableHead>User</TableHead>
          <TableHead className="text-right">{label}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={3} className="py-6 text-center text-xs text-slate-500">{loading ? "Loading…" : "No data"}</TableCell></TableRow>
        ) : (
          rows.map((r, i) => (
            <TableRow key={r.user_id}>
              <TableCell className="text-xs font-bold text-slate-400">{i + 1}</TableCell>
              <TableCell className="text-xs font-medium">{r.display}</TableCell>
              <TableCell className="text-right text-xs font-black text-emerald-700">৳ {Math.round(r.amount).toLocaleString("en-BD")}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

// ================= PROMOTIONS =================
type PromoRow = {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  type: "deposit_bonus" | "free_credit" | "cashback";
  bonus_pct: number;
  bonus_fixed: number;
  min_deposit: number;
  max_bonus: number;
  wagering_multiplier: number;
  max_uses_total: number | null;
  max_uses_per_user: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
};

const emptyPromo: Partial<PromoRow> = {
  name: "",
  description: "",
  code: "",
  type: "deposit_bonus",
  bonus_pct: 100,
  bonus_fixed: 0,
  min_deposit: 500,
  max_bonus: 5000,
  wagering_multiplier: 20,
  max_uses_total: null,
  max_uses_per_user: 1,
  is_active: true,
};

function AdminPromotions() {
  const [rows, setRows] = useState<PromoRow[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PromoRow> | null>(null);



  // Load using dynamic import so we don't add a top-level import earlier
  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("promotions").select("*").order("created_at", { ascending: false }),
      supabase
        .from("user_promotions")
        .select("id,user_id,promotion_id,granted_amount,wagering_required,wagering_progress,status,created_at,promotions(name,code,type)")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setRows((p ?? []) as any);
    setClaims((c ?? []) as any);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (payload: Partial<PromoRow>) => {
    try {
      const mod = await import("@/lib/promotions.functions");
      await mod.adminUpsertPromotion({ data: payload as any });
      toast.success("Promotion saved");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    try {
      const mod = await import("@/lib/promotions.functions");
      await mod.adminDeletePromotion({ data: { id } });
      toast.success("Deleted");
      load();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">
            {loading ? "Loading…" : `${rows.length} promotion${rows.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <Button onClick={() => setEditing({ ...emptyPromo })} className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
          <Plus className="mr-1 h-4 w-4" /> New Promotion
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Bonus</TableHead>
              <TableHead className="text-right">Min Dep</TableHead>
              <TableHead className="text-right">Wager ×</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && !loading && (
              <TableRow><TableCell colSpan={9} className="text-center text-sm text-slate-400 py-10">কোনো প্রোমো নেই</TableCell></TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-semibold">{r.name}</TableCell>
                <TableCell><code className="text-xs bg-slate-100 rounded px-1.5 py-0.5">{r.code || "—"}</code></TableCell>
                <TableCell><span className="text-xs font-bold uppercase text-slate-600">{r.type.replace("_", " ")}</span></TableCell>
                <TableCell className="text-right text-xs">{r.type === "free_credit" ? `৳${r.bonus_fixed}` : `${r.bonus_pct}%`}{r.max_bonus > 0 && r.type !== "free_credit" ? ` (max ৳${r.max_bonus})` : ""}</TableCell>
                <TableCell className="text-right text-xs">৳{r.min_deposit}</TableCell>
                <TableCell className="text-right text-xs">{r.wagering_multiplier}×</TableCell>
                <TableCell className="text-xs text-slate-500">{r.max_uses_total ?? "∞"} / user {r.max_uses_per_user}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${r.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {r.is_active ? "ACTIVE" : "OFF"}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editing && <PromoEditor value={editing} onCancel={() => setEditing(null)} onSave={save} />}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800">Recent Claims</h3>
          <span className="text-xs text-slate-500">{claims.length} recent</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Promo</TableHead>
                <TableHead className="text-right">Granted</TableHead>
                <TableHead className="text-right">Wagering</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-slate-400 py-6">No claims yet</TableCell></TableRow>}
              {claims.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs text-slate-500">{new Date(c.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-mono">{String(c.user_id).slice(0, 8)}</TableCell>
                  <TableCell className="text-xs">{c.promotions?.name} {c.promotions?.code && <code className="ml-1 text-[10px] text-slate-400">{c.promotions.code}</code>}</TableCell>
                  <TableCell className="text-right text-xs font-bold">৳{Number(c.granted_amount).toLocaleString("en-BD")}</TableCell>
                  <TableCell className="text-right text-xs">{Number(c.wagering_progress).toFixed(0)} / {Number(c.wagering_required).toFixed(0)}</TableCell>
                  <TableCell><span className={`text-[10px] font-bold uppercase ${c.status === "completed" ? "text-emerald-600" : c.status === "active" ? "text-blue-600" : "text-slate-400"}`}>{c.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function PromoEditor({ value, onCancel, onSave }: { value: Partial<PromoRow>; onCancel: () => void; onSave: (v: Partial<PromoRow>) => void }) {
  const [f, setF] = useState<Partial<PromoRow>>(value);
  const set = (k: keyof PromoRow, v: any) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl my-8">
        <h3 className="text-lg font-black text-slate-900">{f.id ? "Edit Promotion" : "New Promotion"}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-bold text-slate-600">
            Name
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="col-span-2 text-xs font-bold text-slate-600">
            Description
            <Input value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Type
            <select
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={f.type ?? "deposit_bonus"}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="deposit_bonus">Deposit Bonus</option>
              <option value="free_credit">Free Credit</option>
              <option value="cashback">Cashback</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-600">
            Promo Code (optional)
            <Input value={f.code ?? ""} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="WELCOME100" />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Bonus %
            <Input type="number" value={f.bonus_pct ?? 0} onChange={(e) => set("bonus_pct", Number(e.target.value))} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Fixed Amount (৳)
            <Input type="number" value={f.bonus_fixed ?? 0} onChange={(e) => set("bonus_fixed", Number(e.target.value))} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Min Deposit (৳)
            <Input type="number" value={f.min_deposit ?? 0} onChange={(e) => set("min_deposit", Number(e.target.value))} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Max Bonus (৳, 0 = no cap)
            <Input type="number" value={f.max_bonus ?? 0} onChange={(e) => set("max_bonus", Number(e.target.value))} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Wagering ×
            <Input type="number" value={f.wagering_multiplier ?? 0} onChange={(e) => set("wagering_multiplier", Number(e.target.value))} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Max Uses Total (blank = ∞)
            <Input type="number" value={f.max_uses_total ?? ""} onChange={(e) => set("max_uses_total", e.target.value ? Number(e.target.value) : null)} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Max Uses Per User
            <Input type="number" value={f.max_uses_per_user ?? 1} onChange={(e) => set("max_uses_per_user", Number(e.target.value))} />
          </label>
          <label className="col-span-2 flex items-center gap-2 text-xs font-bold text-slate-600">
            <input type="checkbox" checked={f.is_active ?? true} onChange={(e) => set("is_active", e.target.checked)} />
            Active
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(f)} className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ Tournaments ============
type Tourney = {
  id: string;
  name: string;
  description: string | null;
  game_id: string | null;
  starts_at: string;
  ends_at: string;
  prize_pool: number;
  prize_distribution: number[];
  min_bet: number;
  capacity: number | null;
  is_active: boolean;
  finalized_at: string | null;
  created_at: string;
};

const emptyTourney: Partial<Tourney> = {
  name: "",
  description: "",
  game_id: null,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 16),
  prize_pool: 10000,
  prize_distribution: [50, 30, 20],
  min_bet: 10,
  capacity: null,
  is_active: true,
};

function AdminTournaments() {
  const [rows, setRows] = useState<Tourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Tourney> | null>(null);
  const [finalizing, setFinalizing] = useState<string | null>(null);
  const [entriesFor, setEntriesFor] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("tournaments").select("*").order("starts_at", { ascending: false });
    setRows((data ?? []) as any);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (payload: Partial<Tourney>) => {
    try {
      const mod = await import("@/lib/tournaments.functions");
      await mod.adminUpsertTournament({
        data: {
          ...(payload as any),
          starts_at: new Date(payload.starts_at as string).toISOString(),
          ends_at: new Date(payload.ends_at as string).toISOString(),
          prize_pool: Number(payload.prize_pool ?? 0),
          min_bet: Number(payload.min_bet ?? 0),
          prize_distribution: (payload.prize_distribution ?? []).map(Number),
        },
      });
      toast.success("Tournament saved");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this tournament? Entries will be removed too.")) return;
    try {
      const mod = await import("@/lib/tournaments.functions");
      await mod.adminDeleteTournament({ data: { id } });
      toast.success("Deleted");
      load();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const finalize = async (t: Tourney) => {
    if (!confirm(`Finalize "${t.name}"? Prizes will be credited to top ranks and the tournament will close.`)) return;
    setFinalizing(t.id);
    try {
      const mod = await import("@/lib/tournaments.functions");
      const r = await mod.adminFinalizeTournament({ data: { id: t.id } });
      toast.success(`Paid ৳${r.totalPaid.toLocaleString("en-BD")} to ${r.paidUsers} winner(s)`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Finalize failed");
    } finally {
      setFinalizing(null);
    }
  };

  const openEntries = async (t: Tourney) => {
    setEntriesFor(t.id);
    try {
      const mod = await import("@/lib/tournaments.functions");
      const r = await mod.getTournamentLeaderboard({ data: { tournamentId: t.id, limit: 100 } });
      setEntries(r.rows as any);
    } catch { setEntries([]); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">{loading ? "Loading…" : `${rows.length} tournament${rows.length === 1 ? "" : "s"}`}</div>
        <Button onClick={() => setEditing({ ...emptyTourney })} className="bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white">
          <Plus className="mr-1 h-4 w-4" /> New Tournament
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>Window</TableHead>
              <TableHead className="text-right">Prize Pool</TableHead>
              <TableHead>Distribution</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && !loading && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-slate-400 py-10">কোনো টুর্নামেন্ট নেই</TableCell></TableRow>
            )}
            {rows.map((r) => {
              const now = Date.now();
              const s = new Date(r.starts_at).getTime();
              const e = new Date(r.ends_at).getTime();
              const status = r.finalized_at ? "finalized" : !r.is_active ? "off" : now > e ? "ended" : now < s ? "upcoming" : "live";
              const badgeColor: Record<string, string> = {
                live: "bg-emerald-50 text-emerald-700",
                upcoming: "bg-blue-50 text-blue-700",
                ended: "bg-amber-50 text-amber-700",
                finalized: "bg-slate-100 text-slate-500",
                off: "bg-slate-100 text-slate-500",
              };
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-800">{r.name}</div>
                    {r.description && <div className="text-[11px] text-slate-400 line-clamp-1">{r.description}</div>}
                  </TableCell>
                  <TableCell className="text-xs">{r.game_id ?? <span className="text-slate-400">সব</span>}</TableCell>
                  <TableCell className="text-[11px] text-slate-500">
                    {new Date(r.starts_at).toLocaleString()}<br />→ {new Date(r.ends_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-black text-fuchsia-600">৳{Number(r.prize_pool).toLocaleString("en-BD")}</TableCell>
                  <TableCell className="text-[11px] text-slate-600">{(r.prize_distribution ?? []).join("/")}%</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badgeColor[status]}`}>{status}</span>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => openEntries(r)}>Entries</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
                    {status !== "finalized" && (status === "ended" || status === "live") && (
                      <Button size="sm" variant="ghost" onClick={() => finalize(r)} disabled={finalizing === r.id} className="text-emerald-600">
                        {finalizing === r.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Finalize"}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="text-rose-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {editing && <TournamentEditor value={editing} onCancel={() => setEditing(null)} onSave={save} />}

      {entriesFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto" onClick={() => setEntriesFor(null)}>
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900 mb-3">Live Leaderboard</h3>
            {entries.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">এখনও কোনো এনট্রি নেই।</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>User</TableHead><TableHead className="text-right">Wager</TableHead><TableHead className="text-right">Bets</TableHead><TableHead className="text-right">Prize</TableHead></TableRow></TableHeader>
                <TableBody>
                  {entries.map((r: any) => (
                    <TableRow key={r.user_id}>
                      <TableCell className="font-bold">#{r.rank}</TableCell>
                      <TableCell className="text-xs">{r.display_name ?? r.username ?? String(r.user_id).slice(0,8)}</TableCell>
                      <TableCell className="text-right text-xs">৳{Number(r.total_wager).toLocaleString("en-BD")}</TableCell>
                      <TableCell className="text-right text-xs">{r.total_bets}</TableCell>
                      <TableCell className="text-right text-xs font-bold text-emerald-600">{r.prize > 0 ? `৳${Number(r.prize).toLocaleString("en-BD")}` : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-4 flex justify-end"><Button variant="outline" onClick={() => setEntriesFor(null)}>Close</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function TournamentEditor({ value, onCancel, onSave }: { value: Partial<Tourney>; onCancel: () => void; onSave: (v: Partial<Tourney>) => void }) {
  const [f, setF] = useState<Partial<Tourney>>({
    ...value,
    starts_at: value.starts_at ? new Date(value.starts_at).toISOString().slice(0, 16) : "",
    ends_at: value.ends_at ? new Date(value.ends_at).toISOString().slice(0, 16) : "",
    prize_distribution: value.prize_distribution ?? [50, 30, 20],
  });
  const set = (k: keyof Tourney, v: any) => setF((p) => ({ ...p, [k]: v }));
  const distStr = (f.prize_distribution ?? []).join(",");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl my-8">
        <h3 className="text-lg font-black text-slate-900">{f.id ? "Edit Tournament" : "New Tournament"}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-bold text-slate-600">
            Name
            <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="col-span-2 text-xs font-bold text-slate-600">
            Description
            <Input value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Game ID (blank = সব গেম)
            <Input value={f.game_id ?? ""} onChange={(e) => set("game_id", e.target.value.trim() || null)} placeholder="crash, mines, plinko…" />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Min Bet (৳)
            <Input type="number" value={f.min_bet ?? 0} onChange={(e) => set("min_bet", Number(e.target.value))} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Starts At
            <Input type="datetime-local" value={f.starts_at as string} onChange={(e) => set("starts_at", e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Ends At
            <Input type="datetime-local" value={f.ends_at as string} onChange={(e) => set("ends_at", e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Prize Pool (৳)
            <Input type="number" value={f.prize_pool ?? 0} onChange={(e) => set("prize_pool", Number(e.target.value))} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Capacity (blank = ∞)
            <Input type="number" value={f.capacity ?? ""} onChange={(e) => set("capacity", e.target.value ? Number(e.target.value) : null)} />
          </label>
          <label className="col-span-2 text-xs font-bold text-slate-600">
            Prize Distribution % (কমা দিয়ে, sum = 100)
            <Input
              value={distStr}
              onChange={(e) => set("prize_distribution", e.target.value.split(",").map((v) => Number(v.trim())).filter((n) => !isNaN(n)))}
              placeholder="50, 30, 20"
            />
            <span className="mt-1 block text-[10px] text-slate-400">
              Sum: {(f.prize_distribution ?? []).reduce((a, b) => a + Number(b || 0), 0)}%
            </span>
          </label>
          <label className="col-span-2 flex items-center gap-2 text-xs font-bold text-slate-600">
            <input type="checkbox" checked={f.is_active ?? true} onChange={(e) => set("is_active", e.target.checked)} />
            Active
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(f)} className="bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white">Save</Button>
        </div>
      </div>
    </div>
  );
}

// ============ Admin Notifications ============
import { adminBroadcast, adminListNotifications, adminDeleteNotification } from "@/lib/notifications.functions";

function AdminNotifications() {
  const list = useServerFn(adminListNotifications);
  const send = useServerFn(adminBroadcast);
  const del = useServerFn(adminDeleteNotification);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState("system");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications } = await list();
      setRows(notifications);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "লোড ব্যর্থ");
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => { load(); }, [load]);

  async function handleSend() {
    if (!title.trim()) return toast.error("Title দিন");
    setSending(true);
    try {
      await send({ data: { title, body: body || null, link: link || null, category } });
      toast.success("📢 ব্রডকাস্ট পাঠানো হয়েছে");
      setTitle(""); setBody(""); setLink("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ব্যর্থ");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ডিলিট করবেন?")) return;
    try {
      await del({ data: { id } });
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("ডিলিট হয়েছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ব্যর্থ");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-md">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <div className="text-base font-black text-slate-900">Broadcast পাঠান</div>
            <div className="text-xs text-slate-500">সব ইউজারের নোটিফিকেশনে পাঠানো হবে</div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Title (e.g. 🎉 নতুন প্রোমো লাইভ)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
            <option value="system">System</option>
            <option value="bonus">Bonus / Promo</option>
            <option value="vip">VIP</option>
            <option value="wallet">Wallet</option>
          </select>
          <Input placeholder="Link (optional, e.g. /promotions)" value={link} onChange={(e) => setLink(e.target.value)} className="md:col-span-2" />
          <textarea
            placeholder="Body message (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="md:col-span-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSend} disabled={sending} className="bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white">
            {sending ? "পাঠাচ্ছি…" : "📢 Broadcast পাঠান"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="text-sm font-black text-slate-900">সাম্প্রতিক নোটিফিকেশন ({rows.length})</div>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3 w-3 mr-1" /> Refresh</Button>
        </div>
        <div className="max-h-[500px] overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">লোড হচ্ছে…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">এখনো কোনো নোটিফিকেশন নেই</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.is_broadcast ? (
                        <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-bold text-fuchsia-700">📢 Broadcast</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Personal</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      <div className="text-sm font-bold text-slate-900">{r.title}</div>
                      {r.body && <div className="text-xs text-slate-500 truncate">{r.body}</div>}
                    </TableCell>
                    <TableCell><span className="text-xs font-semibold uppercase text-slate-600">{r.category}</span></TableCell>
                    <TableCell className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-3 w-3 text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
