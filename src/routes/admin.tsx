import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, ShieldCheck, ShieldOff, Plus, Minus, Eye, Users as UsersIcon, Wallet, TrendingUp, Clock, RefreshCw, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { TxnDetailsDialog } from "@/components/TxnDetailsDialog";

const searchSchema = z.object({ tab: z.enum(["overview", "txns", "users", "methods", "games"]).optional() });

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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-white/70">
        <div className="flex items-center gap-3 text-sm"><RefreshCw className="h-4 w-4 animate-spin" /> Loading admin…</div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] px-4">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-black/60 p-8 text-center">
          <ShieldOff className="mx-auto h-10 w-10 text-red-400" />
          <h1 className="mt-3 text-2xl font-black text-white">Access Denied</h1>
          <p className="mt-2 text-sm text-white/70">শুধুমাত্র অ্যাডমিন এই পেজ দেখতে পারবেন।</p>
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
    </AdminShell>
  );
}

function StatCard({ label, value, hint, icon: Icon, tone = "cyan", urgent }: any) {
  const tones: Record<string, string> = {
    cyan: "from-cyan-500/20 to-cyan-500/0 text-cyan-300 border-cyan-500/20",
    orange: "from-orange-500/20 to-orange-500/0 text-orange-300 border-orange-500/20",
    green: "from-emerald-500/20 to-emerald-500/0 text-emerald-300 border-emerald-500/20",
    gold: "from-yellow-500/20 to-yellow-500/0 text-yellow-300 border-yellow-500/20",
    red: "from-red-500/20 to-red-500/0 text-red-300 border-red-500/20",
  };
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${tones[tone]} p-5 ${urgent ? "ring-2 ring-orange-500/60 animate-pulse" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-bold uppercase tracking-widest text-white/60">{label}</div>
        <div className="rounded-lg bg-white/5 p-2"><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 text-3xl font-black text-white">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-white/50">{hint}</div>}
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

  if (stats.loading) return <div className="flex items-center gap-2 text-white/60"><RefreshCw className="h-4 w-4 animate-spin" /> Loading stats…</div>;

  const revenue = stats.depositsAllTime - stats.withdrawsAllTime;
  const netToday = stats.depositsToday - stats.withdrawsToday;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={stats.userCount.toLocaleString()} hint="Registered profiles" icon={UsersIcon} tone="cyan" />
        <StatCard label="Pending Requests" value={stats.pendingCount.toLocaleString()} hint="Awaiting approval" icon={Clock} tone="orange" urgent={stats.pendingCount > 0} />
        <StatCard label="User Balance" value={`৳${stats.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} hint="Sum of all wallets" icon={Wallet} tone="green" />
        <StatCard label="Net Revenue" value={`৳${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} hint="Deposits − Withdraws" icon={TrendingUp} tone={revenue >= 0 ? "gold" : "red"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0d1119] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/50">Today</div>
              <div className="text-lg font-black text-white">আজকের কার্যক্রম</div>
            </div>
            <button onClick={load} className="rounded-md border border-white/10 p-2 text-white/60 hover:text-white"><RefreshCw className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-white/60"><ArrowDownRight className="h-3 w-3 text-emerald-400" /> Deposit</div>
              <div className="mt-2 text-2xl font-black text-emerald-300">৳{stats.depositsToday.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-white/60"><ArrowUpRight className="h-3 w-3 text-red-400" /> Withdraw</div>
              <div className="mt-2 text-2xl font-black text-red-300">৳{stats.withdrawsToday.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="text-[11px] font-bold uppercase text-white/60">Net</div>
              <div className={`mt-2 text-2xl font-black ${netToday >= 0 ? "text-yellow-300" : "text-red-300"}`}>৳{netToday.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-5">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/50">Recent Activity</div>
          <div className="space-y-2">
            {stats.recent.length === 0 && <div className="text-xs text-white/40">No activity yet</div>}
            {stats.recent.map((r: any) => (
              <div key={r.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/30 px-3 py-2">
                <div className={`h-2 w-2 rounded-full ${r.status === "approved" ? "bg-emerald-400" : r.status === "pending" ? "bg-orange-400" : "bg-red-400"}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-white">{r.profiles?.display_name || r.profiles?.username || r.profiles?.phone || "User"}</div>
                  <div className="text-[10px] text-white/40 capitalize">{r.type} · {r.status}</div>
                </div>
                <div className="text-xs font-black text-[var(--neon-green)]">৳{Number(r.amount).toFixed(0)}</div>
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
    <div className="rounded-2xl border border-white/10 bg-[#0d1119] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="text-sm font-black uppercase tracking-wider text-white">{title}</div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${map[status] ?? "bg-white/10 text-white/70 border-white/20"}`}>{status}</span>;
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
    load();
  }

  return (
    <Panel
      title="Transactions"
      action={
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1 text-[11px] font-bold uppercase transition ${filter === f ? "bg-[var(--neon-green)]/20 text-[var(--neon-green)]" : "text-white/50 hover:text-white"}`}>{f}</button>
          ))}
          <button onClick={load} className="ml-1 rounded-md p-1.5 text-white/50 hover:text-white"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {loading ? <div className="text-white/60">Loading…</div> : rows.length === 0 ? <div className="py-8 text-center text-white/40">No transactions</div> : (
        <div className="overflow-x-auto rounded-lg border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 bg-black/40">
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
                <TableRow key={r.id} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <div className="font-bold text-white">{r.profiles?.display_name || r.profiles?.username || "—"}</div>
                    <div className="text-[10px] text-white/40">{r.profiles?.phone || r.profiles?.email}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold capitalize ${r.type === "deposit" ? "text-emerald-300" : r.type === "withdraw" ? "text-red-300" : "text-yellow-300"}`}>
                      {r.type === "deposit" ? <ArrowDownRight className="h-3 w-3" /> : r.type === "withdraw" ? <ArrowUpRight className="h-3 w-3" /> : null}
                      {r.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-black text-[var(--neon-green)]">৳{Number(r.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-mono text-white/60">{r.txn_reference || r.sender_account || r.receiver_account || "—"}</TableCell>
                  <TableCell><StatusPill status={r.status} /></TableCell>
                  <TableCell className="text-xs text-white/50">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => setDetailId(r.id)} className="h-7 border-white/10"><Eye className="h-3 w-3" /></Button>
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

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("id, display_name, username, email, phone, wallet_balance, vip_tier, referral_code, created_at, user_roles(role)").order("created_at", { ascending: false }).limit(200);
    setUsers(data ?? []);
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
    const { data: me } = await supabase.auth.getUser();
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      type: sign > 0 ? "bonus" : "withdraw",
      status: "approved",
      amount: amt,
      admin_note: note || (sign > 0 ? "Admin credit" : "Admin debit"),
      approved_by: me.user?.id,
      approved_at: new Date().toISOString(),
    });
    if (error) return toast.error(error.message);
    toast.success("ব্যালেন্স আপডেট হয়েছে");
    load();
  }

  async function toggleAdmin(userId: string, isAdmin: boolean) {
    if (isAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Admin role সরানো হয়েছে");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Admin বানানো হয়েছে");
    }
    load();
  }

  return (
    <Panel
      title={`Users (${filtered.length})`}
      action={
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <Input placeholder="Search name / phone / email…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-72 border-white/10 bg-black/40 pl-8 text-xs" />
        </div>
      }
    >
      {loading ? <div className="text-white/60">Loading…</div> : (
        <div className="overflow-x-auto rounded-lg border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 bg-black/40">
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
                  <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 text-xs font-black text-white">
                          {(u.display_name || u.username || "?")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 font-bold text-white">
                            {u.display_name || u.username || "—"}
                            {isAdmin && <ShieldCheck className="h-3 w-3 text-red-400" />}
                          </div>
                          <div className="text-[10px] text-white/40">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-white/70">{u.phone || "—"}</TableCell>
                    <TableCell className="font-black text-[var(--neon-green)]">৳{Number(u.wallet_balance).toFixed(2)}</TableCell>
                    <TableCell><span className="rounded-md bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-300">{u.vip_tier}</span></TableCell>
                    <TableCell className="font-mono text-xs text-white/60">{u.referral_code}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => adjust(u.id, 1)} className="h-7 bg-emerald-500 hover:bg-emerald-600 text-black"><Plus className="h-3 w-3" /></Button>
                        <Button size="sm" onClick={() => adjust(u.id, -1)} variant="destructive" className="h-7"><Minus className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" onClick={() => toggleAdmin(u.id, isAdmin)} className="h-7 border-white/10">
                          {isAdmin ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                        </Button>
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Kind</label>
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })} className="mt-1 h-9 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white">
                {["bkash", "nagad", "rocket", "bank", "usdt", "other"].map((k) => <option key={k} value={k} className="bg-black">{k}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Label</label>
              <Input placeholder="e.g. bKash Personal" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="mt-1 border-white/10 bg-black/40" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Account Number</label>
              <Input placeholder="017…" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} className="mt-1 border-white/10 bg-black/40" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Instructions</label>
              <Input placeholder="Send Money, then submit ref" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="mt-1 border-white/10 bg-black/40" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Min Deposit</label>
                <Input type="number" value={form.min_deposit} onChange={(e) => setForm({ ...form, min_deposit: Number(e.target.value) })} className="mt-1 border-white/10 bg-black/40" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Min Withdraw</label>
                <Input type="number" value={form.min_withdraw} onChange={(e) => setForm({ ...form, min_withdraw: Number(e.target.value) })} className="mt-1 border-white/10 bg-black/40" />
              </div>
            </div>
            <Button onClick={add} className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-black font-black">+ Add Method</Button>
          </div>
        </Panel>
      </div>
      <div className="lg:col-span-3">
        <Panel title="Active Methods">
          {loading ? <div className="text-white/60">Loading…</div> : rows.length === 0 ? <div className="py-8 text-center text-white/40">No methods yet</div> : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-[10px] font-black uppercase ${r.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/40"}`}>{r.kind.slice(0,4)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white">{r.label}</div>
                    <div className="text-xs font-mono text-white/50">{r.account_number}</div>
                  </div>
                  <div className="text-[10px] text-white/50">
                    <div>Min D: ৳{r.min_deposit}</div>
                    <div>Min W: ৳{r.min_withdraw}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(r.id, r.is_active)} className="h-7 border-white/10 text-xs">{r.is_active ? "Disable" : "Enable"}</Button>
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
      {loading ? <div className="text-white/60">Loading…</div> : rows.length === 0 ? <div className="py-8 text-center text-white/40">No games configured</div> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => {
            const dirty = !!edits[r.id];
            return (
              <div key={r.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-black text-white">{r.name}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-white/40">{r.game_key}</div>
                  </div>
                  <button
                    onClick={() => toggleEnabled(r)}
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${r.is_enabled ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-red-500/40 bg-red-500/15 text-red-300"}`}
                  >
                    {r.is_enabled ? "● Enabled" : "○ Disabled"}
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-white/50">Min Bet</label>
                    <Input type="number" value={valOf(r, "min_bet")} onChange={(e) => setField(r.id, "min_bet", Number(e.target.value))} className="mt-1 h-8 border-white/10 bg-black/60 text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-white/50">Max Bet</label>
                    <Input type="number" value={valOf(r, "max_bet")} onChange={(e) => setField(r.id, "max_bet", Number(e.target.value))} className="mt-1 h-8 border-white/10 bg-black/60 text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-white/50">Edge %</label>
                    <Input type="number" step="0.1" value={Number(valOf(r, "house_edge")) * 100} onChange={(e) => setField(r.id, "house_edge", Number(e.target.value) / 100)} className="mt-1 h-8 border-white/10 bg-black/60 text-xs" />
                  </div>
                </div>
                <Button size="sm" onClick={() => save(r)} disabled={!dirty} className={`mt-3 w-full font-black ${dirty ? "bg-emerald-500 hover:bg-emerald-600 text-black" : "bg-white/5 text-white/30"}`}>
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
