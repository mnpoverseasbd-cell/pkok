import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { SiteShell } from "@/components/landing/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, ShieldCheck, ShieldOff, Plus, Minus } from "lucide-react";

const searchSchema = z.object({ tab: z.enum(["txns", "users", "methods"]).optional() });

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — PKOK" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const search = useSearch({ from: "/admin" });
  const tab = search.tab ?? "txns";

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || roleLoading) return <SiteShell><div className="p-16 text-center text-white/70">Loading…</div></SiteShell>;
  if (!isAdmin) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-md p-16 text-center">
          <h1 className="text-2xl font-black text-white">Access Denied</h1>
          <p className="mt-2 text-sm text-white/70">শুধুমাত্র অ্যাডমিন এই পেজ দেখতে পারবেন।</p>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4">
        <h1 className="mb-3 text-2xl font-black text-white">Admin Dashboard</h1>
        <div className="mb-4 flex gap-2 rounded-lg border border-white/10 bg-black/40 p-1">
          {[
            { k: "txns", label: "Transactions" },
            { k: "users", label: "Users" },
            { k: "methods", label: "Payment Methods" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => navigate({ to: "/admin", search: { tab: t.k as any } })}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${tab === t.k ? "bg-[var(--neon-green)]/20 text-[var(--neon-green)]" : "text-white/70 hover:text-white"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "txns" && <AdminTxns />}
        {tab === "users" && <AdminUsers />}
        {tab === "methods" && <AdminMethods />}
      </div>
    </SiteShell>
  );
}

function AdminTxns() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [loading, setLoading] = useState(true);

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
      // fallback without profile join
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
    <Card className="border-white/10 bg-black/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Transactions</CardTitle>
        <div className="flex gap-1">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-2 py-1 text-xs font-bold ${filter === f ? "bg-[var(--neon-gold)]/20 text-[var(--neon-gold)]" : "text-white/60"}`}>{f}</button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="text-white/70">Loading…</div> : rows.length === 0 ? <div className="text-white/60">No transactions</div> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-white/90">
                      <div className="font-bold">{r.profiles?.display_name || r.profiles?.username || "—"}</div>
                      <div className="text-[10px] text-white/50">{r.profiles?.phone || r.profiles?.email}</div>
                    </TableCell>
                    <TableCell className="capitalize text-white/80">{r.type}</TableCell>
                    <TableCell className="font-bold text-[var(--neon-green)]">৳{Number(r.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-white/70 text-xs">{r.txn_reference || r.sender_account || r.receiver_account || "—"}</TableCell>
                    <TableCell className="text-xs capitalize text-white/70">{r.status}</TableCell>
                    <TableCell className="text-xs text-white/60">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      {r.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => act(r.id, "approved")} className="h-7 bg-green-button text-[var(--background)]"><CheckCircle2 className="h-3 w-3" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => act(r.id, "rejected")} className="h-7"><XCircle className="h-3 w-3" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("profiles").select("id, display_name, username, email, phone, wallet_balance, vip_tier, referral_code, created_at, user_roles(role)").order("created_at", { ascending: false }).limit(200);
    const { data } = await q;
    setUsers(data ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [u.display_name, u.username, u.email, u.phone, u.referral_code].some((v) => v?.toLowerCase().includes(q));
  });

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
    <Card className="border-white/10 bg-black/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Users</CardTitle>
        <Input placeholder="Search name / phone / email / ref…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </CardHeader>
      <CardContent>
        {loading ? <div className="text-white/70">Loading…</div> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>VIP</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const isAdmin = (u.user_roles ?? []).some((r: any) => r.role === "admin");
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="text-white/90">
                        <div className="font-bold">{u.display_name || u.username || "—"} {isAdmin && <ShieldCheck className="inline h-3 w-3 text-red-400" />}</div>
                        <div className="text-[10px] text-white/50">{u.email}</div>
                      </TableCell>
                      <TableCell className="text-white/70 text-xs">{u.phone || "—"}</TableCell>
                      <TableCell className="font-bold text-[var(--neon-green)]">৳{Number(u.wallet_balance).toFixed(2)}</TableCell>
                      <TableCell className="text-xs capitalize text-[var(--neon-gold)]">{u.vip_tier}</TableCell>
                      <TableCell className="font-mono text-xs text-white/70">{u.referral_code}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" onClick={() => adjust(u.id, 1)} className="h-7 bg-green-button text-[var(--background)]"><Plus className="h-3 w-3" /></Button>
                          <Button size="sm" onClick={() => adjust(u.id, -1)} variant="destructive" className="h-7"><Minus className="h-3 w-3" /></Button>
                          <Button size="sm" variant="outline" onClick={() => toggleAdmin(u.id, isAdmin)} className="h-7">
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
      </CardContent>
    </Card>
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
    <div className="space-y-4">
      <Card className="border-white/10 bg-black/40">
        <CardHeader><CardTitle className="text-white">নতুন পেমেন্ট মেথড</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-white">
            {["bkash", "nagad", "rocket", "bank", "usdt", "other"].map((k) => <option key={k} value={k} className="bg-black">{k}</option>)}
          </select>
          <Input placeholder="Label (e.g. bKash Personal)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <Input placeholder="Account Number" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
          <Input placeholder="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          <Input type="number" placeholder="Min Deposit" value={form.min_deposit} onChange={(e) => setForm({ ...form, min_deposit: Number(e.target.value) })} />
          <Input type="number" placeholder="Min Withdraw" value={form.min_withdraw} onChange={(e) => setForm({ ...form, min_withdraw: Number(e.target.value) })} />
          <Button onClick={add} className="sm:col-span-2 bg-green-button text-[var(--background)] font-bold">Add</Button>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/40">
        <CardHeader><CardTitle className="text-white">বর্তমান মেথড</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-white/70">Loading…</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Kind</TableHead><TableHead>Label</TableHead><TableHead>Account</TableHead><TableHead>Min D/W</TableHead><TableHead>Active</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="uppercase text-white/80">{r.kind}</TableCell>
                    <TableCell className="text-white font-bold">{r.label}</TableCell>
                    <TableCell className="font-mono text-white/70">{r.account_number}</TableCell>
                    <TableCell className="text-xs text-white/70">৳{r.min_deposit} / ৳{r.min_withdraw}</TableCell>
                    <TableCell><span className={r.is_active ? "text-[var(--neon-green)]" : "text-white/40"}>{r.is_active ? "ON" : "OFF"}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => toggleActive(r.id, r.is_active)} className="h-7 text-xs">Toggle</Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(r.id)} className="h-7 text-xs">Del</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
