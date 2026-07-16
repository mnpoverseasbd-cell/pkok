import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminAdjustBalance, adminCreateUser, adminDeleteUser, adminRunVipPayouts, adminPreviewVipPayouts, adminListAuditLogs, adminLogAction, adminListFeatureFlags, adminUpsertFeatureFlag, adminDeleteFeatureFlag } from "@/lib/admin.functions";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, ShieldCheck, ShieldOff, Plus, Minus, Eye, Users as UsersIcon, Wallet, TrendingUp, Clock, RefreshCw, Search, ArrowUpRight, ArrowDownRight, Trash2, UserPlus, Flag } from "lucide-react";
import { TxnDetailsDialog } from "@/components/TxnDetailsDialog";


const searchSchema = z.object({ tab: z.enum(["overview", "txns", "users", "methods", "games", "vip", "audit", "flags"]).optional() });

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
};

function AdminPage() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const search = useSearch({ from: "/admin" });
  const tab = search.tab ?? "overview";

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/admin" } as any });
  }, [loading, user, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex items-center gap-3 text-sm"><RefreshCw className="h-4 w-4 animate-spin" /> Loading admin…</div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-3xl border border-rose-100 bg-white p-10 text-center shadow-xl shadow-rose-500/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30">
            <ShieldOff className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">Access Denied</h1>
          <p className="mt-2 text-sm text-slate-500">শুধুমাত্র অ্যাডমিন এই পেজ দেখতে পারবেন।</p>
        </div>
      </div>
    );
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
    </AdminShell>
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

  const load = useCallback(async () => {
    setStats((s: any) => ({ ...s, loading: true }));
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const iso = startOfDay.toISOString();
    const [users, pending, balances, depToday, wdToday, depAll, wdAll, recent] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("transactions").select("id", { count: "exact", head: true }).eq("status", "pending"),
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
            <div className="mt-1 text-sm text-white/80">প্ল্যাটফর্মের সব কিছু এক নজরে দেখুন</div>
          </div>
          <div className="flex gap-3">
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


function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
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
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("transactions")
      .select("id, user_id, type, status, amount, txn_reference, sender_account, receiver_account, admin_note, created_at, profiles!transactions_user_id_fkey(display_name, username, email, phone)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) {
      const { data: d2 } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100);
      setRows(d2 ?? []);
    } else setRows(data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, status: "approved" | "rejected") {
    const note = status === "rejected" ? prompt("Rejection reason (optional)") ?? "" : "";
    const { error } = await supabase.from("transactions").update({ status, admin_note: note || null }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Approved ✓" : "Rejected");
    adminLogAction({ data: { action: `txn.${status}`, targetType: "transaction", targetId: id, details: note ? { note } : {} } }).catch(() => {});
    load();
  }

  return (
    <Panel
      title="Transactions"
      action={
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1 text-[11px] font-bold uppercase transition ${filter === f ? "bg-emerald-100 text-emerald-600" : "text-slate-400 hover:text-slate-900"}`}>{f}</button>
          ))}
          <button onClick={load} className="ml-1 rounded-md p-1.5 text-slate-400 hover:text-slate-900"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {loading ? <div className="text-slate-500">Loading…</div> : rows.length === 0 ? <div className="py-8 text-center text-slate-400">No transactions</div> : (
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 bg-slate-50">
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
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
                  <TableCell className="font-black text-emerald-600">৳{Number(r.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-500">{r.txn_reference || r.sender_account || r.receiver_account || "—"}</TableCell>
                  <TableCell><StatusPill status={r.status} /></TableCell>
                  <TableCell className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => setDetailId(r.id)} className="h-7 border-slate-200"><Eye className="h-3 w-3" /></Button>
                      {r.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => act(r.id, "approved")} className="h-7 bg-emerald-500 hover:bg-emerald-600 text-black"><CheckCircle2 className="h-3 w-3" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => act(r.id, "rejected")} className="h-7"><XCircle className="h-3 w-3" /></Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <TxnDetailsDialog txnId={detailId} open={!!detailId} onOpenChange={(v) => !v && setDetailId(null)} showUser />
    </Panel>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ phone: "", password: "", initialBalance: "" });
  const [creating, setCreating] = useState(false);

  const doAdjust = useServerFn(adminAdjustBalance);
  const doDelete = useServerFn(adminDeleteUser);
  const doCreate = useServerFn(adminCreateUser);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profs, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, username, email, phone, wallet_balance, vip_tier, referral_code, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (pErr) toast.error(pErr.message);
    if (rErr) console.error("[admin/users] roles error:", rErr);
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });
    setUsers((profs ?? []).map((p: any) => ({ ...p, user_roles: (roleMap.get(p.id) ?? []).map((role) => ({ role })) })));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [u.display_name, u.username, u.email, u.phone, u.referral_code].some((v) => v?.toLowerCase().includes(q));
  }), [users, search]);

  async function adjust(userId: string, sign: 1 | -1) {
    const amtStr = prompt(sign > 0 ? "কত টাকা যোগ করবেন?" : "কত টাকা কাটবেন?");
    if (!amtStr) return;
    const amt = Number(amtStr);
    if (!amt || amt <= 0) return toast.error("সঠিক পরিমাণ দিন");
    const note = prompt("Note (optional)") ?? "";
    try {
      await doAdjust({ data: { userId, amount: sign * amt, note: note || undefined } });
      toast.success("ব্যালেন্স আপডেট হয়েছে");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  async function removeUser(userId: string, name: string) {
    if (!confirm(`"${name}" কে পুরোপুরি ডিলিট করবেন? এটা আর ফেরানো যাবে না।`)) return;
    try {
      await doDelete({ data: { userId } });
      toast.success("User ডিলিট হয়েছে");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  async function createUser() {
    if (!/^01[3-9]\d{8}$/.test(createForm.phone)) return toast.error("সঠিক ফোন নাম্বার দিন");
    if (createForm.password.length < 6) return toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের");
    setCreating(true);
    try {
      const res = await doCreate({
        data: {
          phone: createForm.phone,
          password: createForm.password,
          initialBalance: createForm.initialBalance ? Number(createForm.initialBalance) : undefined,
        },
      });
      if (!res.success) return toast.error("এই ফোন আগে থেকেই রেজিস্টার্ড");
      toast.success("নতুন ইউজার তৈরি হয়েছে");
      setCreateForm({ phone: "", password: "", initialBalance: "" });
      setShowCreate(false);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setCreating(false);
    }
  }

  async function toggleAdmin(userId: string, isAdmin: boolean) {
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
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search name / phone / email…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-64 border-slate-200 bg-slate-50 pl-8 text-xs" />
          </div>
          <Button size="sm" onClick={() => setShowCreate((s) => !s)} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white gap-1">
            <UserPlus className="h-3.5 w-3.5" /> New User
          </Button>
        </div>
      }
    >
      {showCreate && (
        <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-700">নতুন ইউজার তৈরি করুন</div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Input placeholder="Phone (01XXXXXXXXX)" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="border-slate-200 bg-white text-xs" />
            <Input type="text" placeholder="Password (min 6)" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="border-slate-200 bg-white text-xs" />
            <Input type="number" placeholder="Initial ৳ balance (optional)" value={createForm.initialBalance} onChange={(e) => setCreateForm({ ...createForm, initialBalance: e.target.value })} className="border-slate-200 bg-white text-xs" />
            <div className="flex gap-2">
              <Button size="sm" disabled={creating} onClick={createUser} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">{creating ? "…" : "Create"}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)} className="border-slate-200">Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {loading ? <div className="text-slate-500">Loading…</div> : (
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 bg-slate-50">
                <TableHead>User</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>VIP</TableHead>
                <TableHead>Referral</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const isAdmin = (u.user_roles ?? []).some((r: any) => r.role === "admin");
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
                            {isAdmin && <ShieldCheck className="h-3 w-3 text-red-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{u.phone || "—"}</TableCell>
                    <TableCell className="font-black text-emerald-600">৳{Number(u.wallet_balance).toFixed(2)}</TableCell>
                    <TableCell><span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600">{u.vip_tier}</span></TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{u.referral_code}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => adjust(u.id, 1)} className="h-7 bg-emerald-500 hover:bg-emerald-600 text-white" title="টাকা যোগ"><Plus className="h-3 w-3" /></Button>
                        <Button size="sm" onClick={() => adjust(u.id, -1)} className="h-7 bg-amber-500 hover:bg-amber-600 text-white" title="টাকা কাটুন"><Minus className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" onClick={() => toggleAdmin(u.id, isAdmin)} className="h-7 border-slate-200" title={isAdmin ? "Remove admin" : "Make admin"}>
                          {isAdmin ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                        </Button>
                        <Button size="sm" onClick={() => removeUser(u.id, u.display_name || u.username || u.phone || "user")} className="h-7 bg-rose-500 hover:bg-rose-600 text-white" title="Delete"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
  const [edits, setEdits] = useState<Record<string, any>>({});

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
    return edits[r.id]?.[field] ?? r[field];
  }

  async function save(r: any) {
    const patch = edits[r.id];
    if (!patch) return toast.info("কোনো পরিবর্তন নেই");
    const min = Number(patch.min_bet ?? r.min_bet);
    const max = Number(patch.max_bet ?? r.max_bet);
    const edge = Number(patch.house_edge ?? r.house_edge);
    if (!Number.isFinite(min) || min < 0) return toast.error("Min Bet ০ বা তার বেশি হতে হবে");
    if (!Number.isFinite(max) || max <= 0) return toast.error("Max Bet ০ এর বেশি হতে হবে");
    if (min > max) return toast.error("Min Bet, Max Bet এর চেয়ে বড় হতে পারবে না");
    if (!Number.isFinite(edge) || edge < 0 || edge > 1) return toast.error("House Edge ০ থেকে ১০০% এর মধ্যে হতে হবে");
    const { error } = await supabase.from("game_configs").update(patch).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(`${r.name} আপডেট হয়েছে`);
    load();
  }

  async function toggleEnabled(r: any) {
    const { error } = await supabase.from("game_configs").update({ is_enabled: !r.is_enabled }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(`${r.name} ${!r.is_enabled ? "ON" : "OFF"}`);
    load();
  }

  return (
    <Panel title="Game Controls">
      {loading ? <div className="text-slate-500">Loading…</div> : rows.length === 0 ? <div className="py-8 text-center text-slate-400">No games configured</div> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => {
            const dirty = !!edits[r.id];
            return (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-black text-slate-900">{r.name}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-400">{r.game_key}</div>
                  </div>
                  <button
                    onClick={() => toggleEnabled(r)}
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${r.is_enabled ? "border-emerald-300 bg-emerald-100 text-emerald-600" : "border-rose-300 bg-rose-100 text-rose-600"}`}
                  >
                    {r.is_enabled ? "● Enabled" : "○ Disabled"}
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Min Bet</label>
                    <Input type="number" value={valOf(r, "min_bet")} onChange={(e) => setField(r.id, "min_bet", Number(e.target.value))} className="mt-1 h-8 border-slate-200 bg-white text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Max Bet</label>
                    <Input type="number" value={valOf(r, "max_bet")} onChange={(e) => setField(r.id, "max_bet", Number(e.target.value))} className="mt-1 h-8 border-slate-200 bg-white text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Edge %</label>
                    <Input type="number" step="0.1" value={Number(valOf(r, "house_edge")) * 100} onChange={(e) => setField(r.id, "house_edge", Number(e.target.value) / 100)} className="mt-1 h-8 border-slate-200 bg-white text-xs" />
                  </div>
                </div>
                <Button size="sm" onClick={() => save(r)} disabled={!dirty} className={`mt-3 w-full font-black ${dirty ? "bg-emerald-500 hover:bg-emerald-600 text-black" : "bg-slate-50 text-slate-300"}`}>
                  {dirty ? "Save Changes" : "No Changes"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function AdminVipTiers() {
  const [rows, setRows] = useState<any[]>([]);
  const [dirty, setDirty] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("vip_tier_configs").select("*").order("sort_order");
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setDirty({});
    setLoading(false);
  }, []);

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
    const { error } = await supabase.from("vip_tier_configs").update(patch).eq("id", r.id);
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success(`${r.tier.toUpperCase()} tier updated`);
    load();
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
