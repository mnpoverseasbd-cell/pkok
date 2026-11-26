import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  Copy,
  Share2,
  Users,
  Gift,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Coins,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/hooks/useAuth";
import { SiteShell } from "@/components/landing/SiteShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/referral")({
  head: () => ({
    meta: [
      { title: "Referral · Earn Commission — Asik Game" },
      { name: "description", content: "Refer friends and earn lifetime commission on their deposits — auto-credited to your wallet." },
      { property: "og:title", content: "Referral Program — Asik Game" },
      { property: "og:description", content: "Earn lifetime commission on every referral." },
    ],
  }),
  component: ReferralPage,
});

type Referred = {
  id: string;
  display_name: string | null;
  username: string | null;
  created_at: string;
  deposits: number;
};

type Commission = {
  id: string;
  referred_id: string;
  deposit_amount: number;
  commission_pct: number;
  commission_amount: number;
  created_at: string;
};

function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const seed = i * 9973;
        return { x: seed % 100, y: (seed * 7) % 100, s: ((seed * 3) % 3) + 1, o: 0.3 + ((seed % 7) / 10) };
      }),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.s}px`, height: `${s.s}px`, opacity: s.o, boxShadow: "0 0 6px rgba(255,255,255,0.6)" }} />
      ))}
    </div>
  );
}

function ReferralPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const navigate = useNavigate();
  const [referred, setReferred] = useState<Referred[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [pct, setPct] = useState(2);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      const [{ data: profs }, { data: comms }, { data: flag }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, username, created_at").eq("referred_by", user.id).order("created_at", { ascending: false }),
        supabase.from("referral_commissions").select("id, referred_id, deposit_amount, commission_pct, commission_amount, created_at").eq("referrer_id", user.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("feature_flags").select("metadata, enabled").eq("flag_key", "referral_commission_pct").maybeSingle(),
      ]);

      const list = profs ?? [];
      const ids = list.map((p) => p.id);
      let totalsByUser = new Map<string, number>();
      if (ids.length > 0) {
        const { data: txns } = await supabase
          .from("transactions")
          .select("user_id, amount")
          .in("user_id", ids)
          .eq("type", "deposit")
          .eq("status", "approved");
        (txns ?? []).forEach((t) => {
          totalsByUser.set(t.user_id, (totalsByUser.get(t.user_id) ?? 0) + Number(t.amount));
        });
      }

      if (cancelled) return;
      setReferred(list.map((p) => ({ ...p, deposits: totalsByUser.get(p.id) ?? 0 })));
      setCommissions((comms as Commission[]) ?? []);
      const meta = flag?.metadata as { pct?: number } | null;
      if (flag?.enabled && meta?.pct != null) setPct(Number(meta.pct));
      setLoadingData(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading || !user || profileLoading || !profile) {
    return <SiteShell><div className="mx-auto max-w-3xl px-4 py-16 text-center text-white/80">লোড হচ্ছে…</div></SiteShell>;
  }

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${profile.referral_code}`;
  const totalDeposits = referred.reduce((s, r) => s + r.deposits, 0);
  const totalEarned = commissions.reduce((s, c) => s + Number(c.commission_amount), 0);
  const activeReferees = referred.filter((r) => r.deposits > 0).length;

  const nameById = new Map(referred.map((r) => [r.id, r.display_name || r.username || "User"]));

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} কপি হয়েছে`);
  }

  async function share() {
    const text = `আমার রেফারেল কোড দিয়ে জয়েন করো এবং বোনাস পাও!`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Asik Game", text, url: shareLink });
        return;
      } catch { /* cancelled */ }
    }
    copy(shareLink, "লিংক");
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-3 py-6 sm:px-4">
        {/* Cosmic hero */}
        <div className="relative mb-5 overflow-hidden rounded-3xl border border-violet-400/30 bg-gradient-to-br from-[#1a0b3d] via-[#2d1465] to-[#0b1a4a] p-6 shadow-[0_0_60px_-15px_rgba(139,92,246,0.6)] sm:p-8">
          <Starfield />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.35), transparent 70%)" }} />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)" }} />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-200">
              <Sparkles className="h-3 w-3" /> Referral Program · {pct}% Commission
            </div>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              বন্ধু আনুন — <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300">আজীবন কমিশন</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/75 sm:text-base">
              প্রত্যেক রেফার করা ইউজারের অনুমোদিত ডিপোজিট থেকে <span className="font-bold text-amber-200">{pct}%</span> কমিশন অটোমেটিক আপনার ওয়ালেটে যোগ হবে।
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Users className="h-4 w-4" />} label="Total Referrals" value={String(referred.length)} accent="violet" />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Active (Deposited)" value={String(activeReferees)} accent="emerald" />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="তাদের ডিপোজিট" value={`৳${totalDeposits.toFixed(0)}`} accent="cyan" />
          <StatCard icon={<Coins className="h-4 w-4" />} label="Earned Commission" value={`৳${totalEarned.toFixed(2)}`} accent="amber" highlight />
        </div>

        {/* Share card */}
        <div className="mb-5 rounded-2xl border border-violet-400/30 bg-gradient-to-b from-white/[0.04] to-black/40 p-5 shadow-[0_0_40px_-15px_rgba(139,92,246,0.5)] backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Share2 className="h-4 w-4 text-fuchsia-300" /> আপনার রেফারেল কোড ও লিংক
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-500/15 to-orange-500/10 px-5 py-2.5 font-mono text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-100">
              {profile.referral_code}
            </div>
            <Button onClick={() => copy(profile.referral_code, "কোড")} size="sm" variant="outline" className="border-white/15 bg-black/40 text-white hover:bg-white/5">
              <Copy className="h-4 w-4" /> কোড কপি
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1 truncate rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white/80">
              {shareLink}
            </div>
            <Button onClick={() => copy(shareLink, "লিংক")} size="sm" variant="outline" className="border-white/15 bg-black/40 text-white hover:bg-white/5">
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={share} size="sm" className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 font-bold text-white shadow-[0_0_20px_-5px_rgba(217,70,239,0.7)]">
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Referred users */}
          <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-b from-white/[0.04] to-black/40 backdrop-blur">
            <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3">
              <Users className="h-4 w-4 text-violet-300" />
              <h3 className="text-sm font-bold text-white">Your Referrals</h3>
              <span className="ml-auto text-[11px] font-bold text-white/50">{referred.length} total</span>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-3">
              {loadingData ? (
                <div className="p-4 text-sm text-white/60">লোড হচ্ছে…</div>
              ) : referred.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/30 p-8 text-center text-sm text-white/60">
                  এখনো কেউ যোগ দেয়নি। আপনার লিংক শেয়ার করুন!
                </div>
              ) : (
                <div className="space-y-2">
                  {referred.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 p-3 transition hover:border-violet-400/40">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-sm font-black text-white ring-1 ring-violet-400/40">
                          {(r.display_name || r.username || "U").slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-white">{r.display_name || r.username || "User"}</div>
                          <div className="text-[11px] text-white/50">যোগ দিয়েছেন {new Date(r.created_at).toLocaleDateString("bn-BD")}</div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-black text-emerald-300">৳{r.deposits.toFixed(2)}</div>
                        <div className="text-[11px] font-semibold text-amber-300">+৳{(r.deposits * pct / 100).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Commission history */}
          <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-b from-white/[0.04] to-black/40 backdrop-blur shadow-[0_0_40px_-15px_rgba(245,158,11,0.5)]">
            <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3">
              <Coins className="h-4 w-4 text-amber-300" />
              <h3 className="text-sm font-bold text-white">Commission Payouts</h3>
              <span className="ml-auto text-[11px] font-bold text-white/50">Auto-credited</span>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-3">
              {loadingData ? (
                <div className="p-4 text-sm text-white/60">লোড হচ্ছে…</div>
              ) : commissions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/30 p-8 text-center text-sm text-white/60">
                  কোনো কমিশন পাননি এখনো। আপনার রেফার করা ইউজার ডিপোজিট করলে এখানে দেখাবে।
                </div>
              ) : (
                <div className="space-y-2">
                  {commissions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-gradient-to-r from-amber-500/5 to-transparent p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                          <Gift className="h-3.5 w-3.5 text-amber-300" />
                          {nameById.get(c.referred_id) || "Referred user"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-white/50">
                          ডিপোজিট ৳{Number(c.deposit_amount).toFixed(2)} · {new Date(c.created_at).toLocaleString("bn-BD", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-100">+৳{Number(c.commission_amount).toFixed(2)}</div>
                        <div className="text-[10px] font-bold text-amber-300/70">{Number(c.commission_pct)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  highlight,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: "violet" | "emerald" | "cyan" | "amber";
  highlight?: boolean;
}) {
  const map = {
    violet: { border: "border-violet-400/30", chip: "text-violet-200 bg-violet-500/15 border-violet-400/40", val: "text-white" },
    emerald: { border: "border-emerald-400/30", chip: "text-emerald-200 bg-emerald-500/15 border-emerald-400/40", val: "text-emerald-200" },
    cyan: { border: "border-cyan-400/30", chip: "text-cyan-200 bg-cyan-500/15 border-cyan-400/40", val: "text-cyan-200" },
    amber: { border: "border-amber-400/30", chip: "text-amber-200 bg-amber-500/15 border-amber-400/40", val: "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-100" },
  }[accent];
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${map.border} bg-gradient-to-b from-white/[0.04] to-black/40 p-4 backdrop-blur ${highlight ? "shadow-[0_0_30px_-8px_rgba(245,158,11,0.6)]" : ""}`}>
      <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map.chip}`}>
        {icon} {label}
      </div>
      <div className={`mt-2 text-2xl font-black ${map.val}`}>{value}</div>
    </div>
  );
}
