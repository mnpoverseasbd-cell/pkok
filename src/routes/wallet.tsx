import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/hooks/useAuth";
import { SiteShell } from "@/components/landing/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TxnDetailsDialog } from "@/components/TxnDetailsDialog";
import {
  CircleDollarSign,
  Wallet as WalletIcon,
  Banknote,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Copy,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
} from "lucide-react";

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

// Deterministic starfield pattern for the hero
function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const seed = i * 9973;
        return {
          x: (seed % 100),
          y: ((seed * 7) % 100),
          s: ((seed * 3) % 3) + 1,
          o: 0.3 + ((seed % 7) / 10),
        };
      }),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.s}px`,
            height: `${s.s}px`,
            opacity: s.o,
            boxShadow: "0 0 6px rgba(255,255,255,0.6)",
          }}
        />
      ))}
    </div>
  );
}

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

  const balance = profile?.wallet_balance ?? 0;

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-3 py-6 sm:px-4">
        {/* Cosmic hero — balance */}
        <div className="relative mb-5 overflow-hidden rounded-3xl border border-violet-400/30 bg-gradient-to-br from-[#1a0b3d] via-[#2d1465] to-[#0b1a4a] p-5 shadow-[0_0_60px_-15px_rgba(139,92,246,0.6)] sm:p-7">
          <Starfield />
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(236,72,153,0.35), transparent 70%)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)" }}
          />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-violet-200/80">
                <Sparkles className="h-3.5 w-3.5" /> Wallet Balance
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 sm:text-5xl">
                  ৳{balance.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-white/50">BDT</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/60">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> Provably Fair · Instant Settlement
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/wallet"
                search={{ tab: "deposit" }}
                className="group inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-400/20"
              >
                <ArrowDownRight className="h-4 w-4" /> Deposit
              </Link>
              <Link
                to="/wallet"
                search={{ tab: "withdraw" }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-400/20"
              >
                <ArrowUpRight className="h-4 w-4" /> Withdraw
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/10"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Segmented tabs */}
        <div className="mb-5 grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur">
          {(
            [
              { k: "deposit" as const, label: "ডিপোজিট", icon: ArrowDownRight, color: "emerald" },
              { k: "withdraw" as const, label: "উত্তোলন", icon: ArrowUpRight, color: "amber" },
              { k: "history" as const, label: "হিস্টোরি", icon: History, color: "violet" },
            ]
          ).map((t) => {
            const active = tab === t.k;
            const activeCls =
              t.color === "emerald"
                ? "bg-gradient-to-br from-emerald-500/25 to-teal-500/15 text-emerald-200 shadow-[0_0_20px_-5px_rgba(16,185,129,0.6)] border-emerald-400/40"
                : t.color === "amber"
                ? "bg-gradient-to-br from-amber-500/25 to-orange-500/15 text-amber-200 shadow-[0_0_20px_-5px_rgba(245,158,11,0.6)] border-amber-400/40"
                : "bg-gradient-to-br from-violet-500/25 to-fuchsia-500/15 text-violet-200 shadow-[0_0_20px_-5px_rgba(139,92,246,0.6)] border-violet-400/40";
            return (
              <button
                key={t.k}
                onClick={() => navigate({ to: "/wallet", search: { tab: t.k } })}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition-all ${
                  active ? activeCls : "border-transparent text-white/60 hover:text-white/90 hover:bg-white/5"
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "deposit" && (
          <div className="space-y-4">
            <DepositForm userId={user.id} onCreated={() => { refetch(); setDepositBump((n) => n + 1); }} />
            <DepositHistory userId={user.id} refreshKey={depositBump} />
          </div>
        )}
        {tab === "withdraw" && (
          <WithdrawForm userId={user.id} balance={balance} onCreated={refetch} />
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

// ============================================================
// Cosmic card wrapper
// ============================================================
function CosmicCard({
  title,
  icon,
  accent = "violet",
  children,
}: {
  title: string;
  icon: ReactNode;
  accent?: "violet" | "emerald" | "amber";
  children: ReactNode;
}) {
  const border =
    accent === "emerald"
      ? "border-emerald-400/30"
      : accent === "amber"
      ? "border-amber-400/30"
      : "border-violet-400/30";
  const glow =
    accent === "emerald"
      ? "shadow-[0_0_40px_-15px_rgba(16,185,129,0.5)]"
      : accent === "amber"
      ? "shadow-[0_0_40px_-15px_rgba(245,158,11,0.5)]"
      : "shadow-[0_0_40px_-15px_rgba(139,92,246,0.5)]";
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${border} bg-gradient-to-b from-white/[0.04] to-black/40 backdrop-blur ${glow}`}>
      <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3">
        <span className="text-white/80">{icon}</span>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
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

  function copyAccount() {
    if (!selected) return;
    navigator.clipboard.writeText(selected.account_number);
    toast.success("একাউন্ট নম্বর কপি হয়েছে");
  }

  return (
    <CosmicCard title="Deposit Request · ডিপোজিট রিকোয়েস্ট" icon={<ArrowDownRight className="h-4 w-4 text-emerald-300" />} accent="emerald">
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Payment Method</label>
          <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethodId(m.id)}
                className={`relative overflow-hidden rounded-xl border px-3 py-3 text-sm font-bold transition-all ${
                  methodId === m.id
                    ? "border-emerald-400/60 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-200 shadow-[0_0_20px_-5px_rgba(16,185,129,0.6)]"
                    : "border-white/10 bg-black/40 text-white/70 hover:border-white/30 hover:bg-white/5"
                }`}
              >
                {methodId === m.id && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                )}
                {m.label}
              </button>
            ))}
            {methods.length === 0 && (
              <div className="col-span-full rounded-lg border border-white/10 bg-black/40 p-3 text-center text-sm text-white/60">
                কোনো পেমেন্ট মেথড উপলব্ধ নেই
              </div>
            )}
          </div>
        </div>

        {selected && (
          <div className="relative overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-200/80">Send money to</div>
                <div className="mt-1 truncate text-xl font-black tracking-wider text-amber-200">
                  {selected.account_number}
                </div>
                {selected.instructions && (
                  <div className="mt-2 text-xs text-white/70">{selected.instructions}</div>
                )}
              </div>
              <button
                onClick={copyAccount}
                className="shrink-0 rounded-lg border border-amber-400/50 bg-amber-400/10 p-2 text-amber-200 transition hover:bg-amber-400/20"
                title="Copy"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="পরিমাণ (৳)">
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={selected ? String(selected.min_deposit) : "500"}
              className="h-11 border-white/10 bg-black/40 text-base font-bold"
            />
          </Field>
          <Field label="আপনার একাউন্ট নম্বর (Sender)">
            <Input
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="017XXXXXXXX"
              className="h-11 border-white/10 bg-black/40"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Transaction ID">
              <Input
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder="TxID / Reference"
                className="h-11 border-white/10 bg-black/40 font-mono"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Note (optional)">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-11 border-white/10 bg-black/40"
              />
            </Field>
          </div>
        </div>

        <Button
          disabled={submitting}
          onClick={submit}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-sm font-black text-black shadow-[0_0_30px_-8px_rgba(16,185,129,0.7)] hover:from-emerald-300 hover:to-teal-400"
        >
          {submitting ? "জমা হচ্ছে…" : "ডিপোজিট রিকোয়েস্ট"}
        </Button>
      </div>
    </CosmicCard>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-white/60">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
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
    <CosmicCard title="Recent Deposits · ডিপোজিট হিস্টোরি" icon={<History className="h-4 w-4 text-violet-300" />} accent="violet">
      {loading ? (
        <div className="p-2 text-sm text-white/70">লোড হচ্ছে…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/30 p-8 text-center text-sm text-white/60">
          এখনো কোনো ডিপোজিট নেই
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => <TxnRow key={r.id} r={r} />)}
        </div>
      )}
    </CosmicCard>
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

  const quickPct = [0.25, 0.5, 0.75, 1];

  return (
    <CosmicCard title="Withdraw Request · উত্তোলন রিকোয়েস্ট" icon={<ArrowUpRight className="h-4 w-4 text-amber-300" />} accent="amber">
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/60">Available</div>
          <div className="mt-0.5 text-2xl font-black text-emerald-300">৳{balance.toFixed(2)}</div>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Withdrawal Method</label>
          <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethodId(m.id)}
                className={`relative overflow-hidden rounded-xl border px-3 py-3 text-sm font-bold transition-all ${
                  methodId === m.id
                    ? "border-amber-400/60 bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-200 shadow-[0_0_20px_-5px_rgba(245,158,11,0.6)]"
                    : "border-white/10 bg-black/40 text-white/70 hover:border-white/30 hover:bg-white/5"
                }`}
              >
                {methodId === m.id && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
                )}
                {m.label}
              </button>
            ))}
            {methods.length === 0 && (
              <div className="col-span-full rounded-lg border border-white/10 bg-black/40 p-3 text-center text-sm text-white/60">
                কোনো মেথড উপলব্ধ নেই
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`পরিমাণ (৳)${selected ? ` — min ৳${selected.min_withdraw}` : ""}`}>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 border-white/10 bg-black/40 text-base font-bold"
            />
            <div className="mt-2 flex gap-1.5">
              {quickPct.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(Math.floor(balance * p)))}
                  className="flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-bold text-white/70 hover:border-amber-400/40 hover:text-amber-200"
                >
                  {p === 1 ? "MAX" : `${p * 100}%`}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Receiver Account">
            <Input
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              placeholder="017XXXXXXXX"
              className="h-11 border-white/10 bg-black/40"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Note (optional)">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-11 border-white/10 bg-black/40"
              />
            </Field>
          </div>
        </div>

        <Button
          disabled={submitting}
          onClick={submit}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-black text-black shadow-[0_0_30px_-8px_rgba(245,158,11,0.7)] hover:from-amber-300 hover:to-orange-400"
        >
          {submitting ? "জমা হচ্ছে…" : "উত্তোলন রিকোয়েস্ট"}
        </Button>
      </div>
    </CosmicCard>
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

  return (
    <CosmicCard title="Transaction History · সব লেনদেন" icon={<History className="h-4 w-4 text-violet-300" />} accent="violet">
      {loading ? (
        <div className="p-2 text-sm text-white/70">লোড হচ্ছে…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/30 p-8 text-center text-sm text-white/60">
          কোনো লেনদেন নেই
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => <TxnRow key={r.id} r={r} />)}
        </div>
      )}
    </CosmicCard>
  );
}

export function TxnRow({ r }: { r: Txn }) {
  const [open, setOpen] = useState(false);
  const isCredit = r.type !== "withdraw" && r.type !== "bet";
  const statusMeta =
    r.status === "approved"
      ? { icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: "text-emerald-300 bg-emerald-500/10 border-emerald-400/30" }
      : r.status === "rejected" || r.status === "cancelled"
      ? { icon: <XCircle className="h-3.5 w-3.5" />, cls: "text-red-300 bg-red-500/10 border-red-400/30" }
      : { icon: <Clock className="h-3.5 w-3.5" />, cls: "text-amber-300 bg-amber-500/10 border-amber-400/30" };
  const sign = isCredit ? "+" : "-";
  const amountCls = isCredit ? "text-emerald-300" : "text-amber-300";
  const iconBg = isCredit ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" : "bg-amber-500/15 text-amber-300 border-amber-400/30";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 p-3 text-left transition-all hover:border-violet-400/40 hover:bg-black/60 hover:shadow-[0_0_20px_-10px_rgba(139,92,246,0.6)]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconBg}`}>
            {isCredit ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold capitalize text-white">{r.type}</span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusMeta.cls}`}>
                {statusMeta.icon} {r.status}
              </span>
            </div>
            <div className="mt-0.5 truncate text-[11px] text-white/50">
              {new Date(r.created_at).toLocaleString()}
              {r.txn_reference ? ` · Ref: ${r.txn_reference}` : ""}
            </div>
            {r.admin_note && <div className="truncate text-[11px] text-white/60">Admin: {r.admin_note}</div>}
          </div>
        </div>
        <div className={`shrink-0 text-lg font-black ${amountCls}`}>
          {sign}৳{Number(r.amount).toFixed(2)}
        </div>
      </button>
      <TxnDetailsDialog txnId={r.id} open={open} onOpenChange={setOpen} />
    </>
  );
}
