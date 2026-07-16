import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/hooks/useAuth";
import { SiteShell } from "@/components/landing/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TxnDetailsDialog } from "@/components/TxnDetailsDialog";
import { CircleDollarSign, Wallet, Banknote, History, CheckCircle2, XCircle, Clock } from "lucide-react";

type TabKey = "deposit" | "withdraw" | "history";

const searchSchema = z.object({
  tab: z.enum(["deposit", "withdraw", "history"]).optional(),
});

const accountRe = /^[0-9+\-\s]{6,32}$/;
const txnRefRe = /^[A-Za-z0-9._-]{4,64}$/;
const noteMax = 500;

const depositSchema = z.object({
  amount: z.number().positive().max(10_000_000),
  sender: z.string().trim().regex(accountRe, "Invalid account number"),
  txnRef: z.string().trim().regex(txnRefRe, "Invalid Transaction ID"),
  note: z.string().trim().max(noteMax).optional(),
});

const withdrawSchema = z.object({
  amount: z.number().positive().max(10_000_000),
  receiver: z.string().trim().regex(accountRe, "Invalid account number"),
  note: z.string().trim().max(noteMax).optional(),
});

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — PKOK" },
      { name: "description", content: "Manage your wallet: deposit, withdraw, and transaction history." },
    ],
  }),
  validateSearch: (search) => searchSchema.parse(search),
  component: WalletPage,
});

type PaymentMethod = {
  id: string;
  kind: string;
  label: string;
  account_number: string;
  instructions: string | null;
  min_deposit: number;
  min_withdraw: number;
  supports_deposit: boolean;
  supports_withdraw: boolean;
};

type Txn = {
  id: string;
  type: string;
  status: string;
  amount: number;
  txn_reference: string | null;
  admin_note: string | null;
  created_at: string;
  approved_at: string | null;
};

function WalletPage() {
  const { user, loading } = useAuth();
  const { profile, refetch } = useProfile(user?.id);
  const navigate = useNavigate();
  const search = useSearch({ from: "/wallet" });
  const tab: TabKey = search.tab ?? "deposit";
  const [depositBump, setDepositBump] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (!user) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-white/80">Loading…</div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-3 py-6 sm:px-4">
        {/* Balance card */}
        <Card className="mb-4 border-[var(--neon-green)]/40 bg-black/50">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-xs uppercase text-white/60">বর্তমান ব্যালেন্স</div>
              <div className="flex items-center gap-2 text-3xl font-black text-[var(--neon-green)]">
                <CircleDollarSign className="h-6 w-6" /> ৳ {(profile?.wallet_balance ?? 0).toFixed(2)}
              </div>
            </div>
            <Link
              to="/profile"
              className="rounded-md border border-[var(--neon-gold)]/60 px-3 py-1.5 text-xs font-bold text-[var(--neon-gold)]"
            >
              প্রোফাইল
            </Link>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 rounded-lg border border-white/10 bg-black/40 p-1">
          {(
            [
              { k: "deposit" as const, label: "ডিপোজিট", icon: Wallet },
              { k: "withdraw" as const, label: "উত্তোলন", icon: Banknote },
              { k: "history" as const, label: "হিস্টোরি", icon: History },
            ]
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => navigate({ to: "/wallet", search: { tab: t.k } })}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                tab === t.k
                  ? "bg-[var(--neon-green)]/20 text-[var(--neon-green)]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "deposit" && (
          <>
            <QuickBuyCoins
              userId={user.id}
              balance={profile?.wallet_balance ?? 0}
              onCredited={() => { refetch(); setDepositBump((n) => n + 1); }}
            />
            <DepositForm userId={user.id} onCreated={() => { refetch(); setDepositBump((n) => n + 1); }} />
            <DepositHistory userId={user.id} refreshKey={depositBump} />
          </>
        )}
        {tab === "withdraw" && (
          <WithdrawForm userId={user.id} balance={profile?.wallet_balance ?? 0} onCreated={refetch} />
        )}
        {tab === "history" && <HistoryList userId={user.id} />}
      </div>
    </SiteShell>
  );
}

function useMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  useEffect(() => {
    supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .then(({ data }) => setMethods((data as PaymentMethod[]) ?? []));
  }, []);
  return methods;
}

function QuickBuyCoins({
  userId,
  balance,
  onCredited,
}: {
  userId: string;
  balance: number;
  onCredited: () => void;
}) {
  const MIN_COINS = 50;
  const MAX_COINS = 100_000;
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const presets = [100, 500, 1000, 5000, 10000];

  function validate(amt: number): string | null {
    if (!Number.isFinite(amt) || amt <= 0) return "সঠিক পরিমাণ দিন";
    if (!Number.isInteger(amt)) return "পূর্ণ সংখ্যা দিন";
    if (amt < MIN_COINS) return `ন্যূনতম ${MIN_COINS} কয়েন`;
    if (amt > MAX_COINS) return `সর্বোচ্চ ${MAX_COINS.toLocaleString()} কয়েন এক বারে`;
    return null;
  }

  async function buy() {
    const amt = Math.floor(Number(amount));
    const err = validate(amt);
    if (err) {
      setError(err);
      toast.error(err);
      return;
    }
    setError(null);
    setSubmitting(true);
    const next = Number(balance) + amt;
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ wallet_balance: next })
      .eq("id", userId);
    if (dbErr) {
      setSubmitting(false);
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "deposit",
        status: "rejected",
        amount: amt,
        txn_reference: "QUICKBUY",
        admin_note: dbErr.message,
      });
      return toast.error(dbErr.message);
    }
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      status: "approved",
      amount: amt,
      txn_reference: "QUICKBUY",
      user_note: "Instant coin top-up",
      approved_at: new Date().toISOString(),
    });
    setSubmitting(false);
    toast.success(`+${amt.toLocaleString()} কয়েন যোগ হয়েছে`);
    setAmount("");
    onCredited();
  }

  return (
    <Card className="mb-4 border-[var(--neon-gold)]/40 bg-black/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <CircleDollarSign className="h-5 w-5 text-[var(--neon-gold)]" /> কয়েন যোগ করুন
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setAmount(String(p)); setError(null); }}
              className="rounded-md border border-[var(--neon-gold)]/40 bg-black/40 px-3 py-1.5 text-sm font-bold text-[var(--neon-gold)] hover:bg-[var(--neon-gold)]/10"
            >
              +{p.toLocaleString()}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs text-white/70">
            কয়েন পরিমাণ ({MIN_COINS}–{MAX_COINS.toLocaleString()})
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min={MIN_COINS}
            max={MAX_COINS}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(null); }}
            placeholder={`যেমন ${MIN_COINS * 20}`}
            aria-invalid={!!error}
            className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {error && <p className="mt-1 text-xs font-semibold text-red-400">{error}</p>}
        </div>
        <Button
          disabled={submitting}
          onClick={buy}
          className="w-full bg-gold-button font-bold text-[var(--background)]"
        >
          {submitting ? "যোগ হচ্ছে…" : "ব্যালেন্সে যোগ করুন"}
        </Button>
        <p className="text-[11px] text-white/50">
          ইনস্ট্যান্ট টপ-আপ — সরাসরি আপনার ব্যালেন্সে যোগ হবে। নিচের ফর্মটি অ্যাডমিন-অনুমোদিত ডিপোজিটের জন্য।
        </p>
      </CardContent>
    </Card>
  );
}

function DepositForm({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const methods = useMethods().filter((m) => m.supports_deposit);
  const [methodId, setMethodId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [sender, setSender] = useState("");
  const [txnRef, setTxnRef] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selected = methods.find((m) => m.id === methodId);

  useEffect(() => {
    if (!methodId && methods[0]) setMethodId(methods[0].id);
  }, [methods, methodId]);

  const MAX_DEPOSIT = 1_000_000;

  async function submit() {
    const amt = Number(amount);
    if (!methodId || !selected) return toast.error("পেমেন্ট মেথড বাছাই করুন");
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("সঠিক পরিমাণ দিন");
    if (amt < selected.min_deposit)
      return toast.error(`ন্যূনতম ৳${selected.min_deposit.toLocaleString()}`);
    if (amt > MAX_DEPOSIT)
      return toast.error(`সর্বোচ্চ ৳${MAX_DEPOSIT.toLocaleString()} এক বারে`);
    if (!sender.trim()) return toast.error("আপনার একাউন্ট নম্বর দিন");
    if (!txnRef.trim()) return toast.error("Transaction ID দিন");
    const parsed = depositSchema.safeParse({ amount: amt, sender, txnRef, note });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      status: "pending",
      amount: parsed.data.amount,
      payment_method_id: methodId,
      sender_account: parsed.data.sender,
      receiver_account: selected.account_number,
      txn_reference: parsed.data.txnRef,
      user_note: parsed.data.note || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("ডিপোজিট রিকোয়েস্ট জমা হয়েছে, অ্যাডমিন অনুমোদনের অপেক্ষায়");
    setAmount(""); setSender(""); setTxnRef(""); setNote("");
    onCreated();
  }

  return (
    <Card className="border-white/10 bg-black/40">
      <CardHeader><CardTitle className="text-white">ডিপোজিট রিকোয়েস্ট</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs text-white/70">পেমেন্ট মেথড</label>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethodId(m.id)}
                className={`rounded-md border px-3 py-2 text-sm font-bold ${
                  methodId === m.id
                    ? "border-[var(--neon-green)] bg-[var(--neon-green)]/15 text-[var(--neon-green)]"
                    : "border-white/15 bg-black/40 text-white/80"
                }`}
              >
                {m.label}
              </button>
            ))}
            {methods.length === 0 && <div className="col-span-full text-sm text-white/60">কোনো পেমেন্ট মেথড উপলব্ধ নেই</div>}
          </div>
        </div>

        {selected && (
          <div className="rounded-md border border-[var(--neon-gold)]/40 bg-black/40 p-3 text-sm">
            <div className="text-white/70">এই নম্বরে টাকা পাঠান:</div>
            <div className="mt-1 text-lg font-black tracking-wider text-[var(--neon-gold)]">
              {selected.account_number}
            </div>
            {selected.instructions && <div className="mt-1 text-xs text-white/70">{selected.instructions}</div>}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-white/70">পরিমাণ (৳)</label>
            <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={selected ? String(selected.min_deposit) : "500"} />
          </div>
          <div>
            <label className="text-xs text-white/70">আপনার একাউন্ট নম্বর (যেখান থেকে পাঠিয়েছেন)</label>
            <Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="017XXXXXXXX" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/70">Transaction ID</label>
            <Input value={txnRef} onChange={(e) => setTxnRef(e.target.value)} placeholder="TxID / Reference" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/70">Note (optional)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <Button disabled={submitting} onClick={submit} className="w-full bg-green-button font-bold text-[var(--background)]">
          {submitting ? "জমা হচ্ছে…" : "ডিপোজিট রিকোয়েস্ট"}
        </Button>
      </CardContent>
    </Card>
  );
}

function DepositHistory({ userId, refreshKey }: { userId: string; refreshKey: number }) {
  const [rows, setRows] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("transactions")
      .select("id, type, status, amount, txn_reference, admin_note, created_at, approved_at")
      .eq("user_id", userId)
      .eq("type", "deposit")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (cancelled) return;
        setRows((data as Txn[]) ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, refreshKey]);

  return (
    <Card className="mt-4 border-white/10 bg-black/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <History className="h-5 w-5 text-[var(--neon-gold)]" /> ডিপোজিট হিস্টোরি
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="p-2 text-sm text-white/70">লোড হচ্ছে…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-black/40 p-6 text-center text-sm text-white/60">
            এখনো কোনো ডিপোজিট নেই
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => <TxnRow key={r.id} r={r} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WithdrawForm({ userId, balance, onCreated }: { userId: string; balance: number; onCreated: () => void }) {
  const methods = useMethods().filter((m) => m.supports_withdraw);
  const [methodId, setMethodId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selected = methods.find((m) => m.id === methodId);

  useEffect(() => {
    if (!methodId && methods[0]) setMethodId(methods[0].id);
  }, [methods, methodId]);

  async function submit() {
    const amt = Number(amount);
    if (!methodId || !selected) return toast.error("মেথড বাছাই করুন");
    if (!amt || amt < selected.min_withdraw)
      return toast.error(`সর্বনিম্ন ৳${selected.min_withdraw}`);
    if (amt > balance) return toast.error("পর্যাপ্ত ব্যালেন্স নেই");
    if (!receiver.trim()) return toast.error("রিসিভ একাউন্ট নম্বর দিন");
    const parsed = withdrawSchema.safeParse({ amount: amt, receiver, note });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "withdraw",
      status: "pending",
      amount: parsed.data.amount,
      payment_method_id: methodId,
      receiver_account: parsed.data.receiver,
      user_note: parsed.data.note || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("উত্তোলন রিকোয়েস্ট জমা হয়েছে");
    setAmount(""); setReceiver(""); setNote("");
    onCreated();
  }

  return (
    <Card className="border-white/10 bg-black/40">
      <CardHeader><CardTitle className="text-white">উত্তোলন রিকোয়েস্ট</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs text-white/70">মেথড</label>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethodId(m.id)}
                className={`rounded-md border px-3 py-2 text-sm font-bold ${
                  methodId === m.id
                    ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/15 text-[var(--neon-gold)]"
                    : "border-white/15 bg-black/40 text-white/80"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-white/70">পরিমাণ (৳) — উপলব্ধ ৳{balance.toFixed(2)}</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-white/70">আপনার একাউন্ট নম্বর (যেখানে পাবেন)</label>
            <Input value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="017XXXXXXXX" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/70">Note (optional)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <Button disabled={submitting} onClick={submit} className="w-full bg-gold-button font-bold text-[var(--background)]">
          {submitting ? "জমা হচ্ছে…" : "উত্তোলন রিকোয়েস্ট"}
        </Button>
      </CardContent>
    </Card>
  );
}

function HistoryList({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("transactions")
      .select("id, type, status, amount, txn_reference, admin_note, created_at, approved_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setRows((data as Txn[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div className="p-4 text-white/70">লোড হচ্ছে…</div>;
  if (rows.length === 0) return <div className="rounded-md border border-white/10 bg-black/40 p-6 text-center text-white/70">কোনো লেনদেন নেই</div>;

  return (
    <div className="space-y-2">
      {rows.map((r) => <TxnRow key={r.id} r={r} />)}
    </div>
  );
}

export function TxnRow({ r }: { r: Txn }) {
  const [open, setOpen] = useState(false);
  const statusIcon = r.status === "approved" ? <CheckCircle2 className="h-4 w-4 text-[var(--neon-green)]" />
    : r.status === "rejected" || r.status === "cancelled" ? <XCircle className="h-4 w-4 text-red-400" />
    : <Clock className="h-4 w-4 text-[var(--neon-gold)]" />;
  const sign = r.type === "withdraw" ? "-" : "+";
  const color = r.type === "withdraw" ? "text-red-300" : "text-[var(--neon-green)]";
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-md border border-white/10 bg-black/40 p-3 text-left transition-colors hover:border-[var(--neon-green)]/50 hover:bg-black/60"
      >
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            {statusIcon} <span className="capitalize">{r.type}</span>
            <span className="text-[10px] uppercase text-white/50">{r.status}</span>
          </div>
          <div className="text-xs text-white/60">{new Date(r.created_at).toLocaleString()}</div>
          {r.txn_reference && <div className="text-[11px] text-white/50">Ref: {r.txn_reference}</div>}
          {r.admin_note && <div className="text-[11px] text-white/70">Admin: {r.admin_note}</div>}
        </div>
        <div className={`text-lg font-black ${color}`}>{sign}৳{Number(r.amount).toFixed(2)}</div>
      </button>
      <TxnDetailsDialog txnId={r.id} open={open} onOpenChange={setOpen} />
    </>
  );
}
