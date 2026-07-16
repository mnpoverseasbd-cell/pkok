import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Share2, Users, Gift, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/hooks/useAuth";
import { SiteShell } from "@/components/landing/SiteShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COMMISSION_RATE = 0.02; // 2% of referred users' approved deposits

export const Route = createFileRoute("/referral")({
  head: () => ({
    meta: [
      { title: "রেফারেল — Asik Game" },
      { name: "description", content: "বন্ধুদের রেফার করুন এবং তাদের ডিপোজিটের ২% কমিশন উপার্জন করুন।" },
      { property: "og:title", content: "রেফারেল প্রোগ্রাম — Asik Game" },
      { property: "og:description", content: "প্রতিটি রেফারেলে আজীবন কমিশন উপার্জন করুন।" },
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

function ReferralPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const navigate = useNavigate();
  const [referred, setReferred] = useState<Referred[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingRefs(true);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, username, created_at")
        .eq("referred_by", user.id)
        .order("created_at", { ascending: false });

      const list = profs ?? [];
      if (list.length === 0) {
        if (!cancelled) {
          setReferred([]);
          setLoadingRefs(false);
        }
        return;
      }

      const ids = list.map((p) => p.id);
      const { data: txns } = await supabase
        .from("transactions")
        .select("user_id, amount")
        .in("user_id", ids)
        .eq("type", "deposit")
        .eq("status", "approved");

      const totals = new Map<string, number>();
      (txns ?? []).forEach((t) => {
        totals.set(t.user_id, (totals.get(t.user_id) ?? 0) + Number(t.amount));
      });

      if (!cancelled) {
        setReferred(list.map((p) => ({ ...p, deposits: totals.get(p.id) ?? 0 })));
        setLoadingRefs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || !user || profileLoading || !profile) {
    return <SiteShell><div className="mx-auto max-w-3xl px-4 py-16 text-center text-white/80">লোড হচ্ছে…</div></SiteShell>;
  }

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${profile.referral_code}`;
  const totalDeposits = referred.reduce((s, r) => s + r.deposits, 0);
  const commission = totalDeposits * COMMISSION_RATE;

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} কপি হয়েছে`);
  }

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Asik Game", text: "আমার রেফারেল কোড দিয়ে জয়েন করো!", url: shareLink });
        return;
      } catch { /* user cancelled */ }
    }
    copy(shareLink, "লিংক");
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl space-y-4 px-3 py-6 sm:px-4">
        <div className="rounded-2xl border border-[var(--neon-gold)]/40 bg-gradient-to-br from-[var(--neon-gold)]/15 to-black/40 p-5">
          <div className="flex items-center gap-2 text-[var(--neon-gold)]">
            <Gift className="h-5 w-5" />
            <span className="text-sm font-bold">রেফারেল প্রোগ্রাম</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">বন্ধু আনুন, আজীবন কমিশন নিন</h1>
          <p className="mt-1 text-sm text-white/75">
            আপনার রেফার করা প্রত্যেক ইউজারের অনুমোদিত ডিপোজিট থেকে <span className="font-bold text-[var(--neon-gold)]">{(COMMISSION_RATE * 100).toFixed(0)}%</span> কমিশন পাবেন।
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard icon={<Users className="h-5 w-5" />} label="মোট রেফারেল" value={String(referred.length)} />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="তাদের ডিপোজিট" value={`৳ ${totalDeposits.toFixed(2)}`} />
          <StatCard icon={<Gift className="h-5 w-5" />} label="আপনার কমিশন" value={`৳ ${commission.toFixed(2)}`} gold />
        </div>

        <Card className="border-white/10 bg-black/40">
          <CardHeader><CardTitle className="text-white">আপনার রেফারেল কোড ও লিংক</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-md border border-[var(--neon-gold)]/50 bg-black/50 px-4 py-2 font-mono text-xl font-black tracking-widest text-[var(--neon-gold)]">
                {profile.referral_code}
              </div>
              <Button onClick={() => copy(profile.referral_code, "কোড")} variant="outline" size="sm">
                <Copy className="h-4 w-4" /> কোড কপি
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1 truncate rounded-md border border-white/15 bg-black/50 px-3 py-2 text-xs text-white/80">
                {shareLink}
              </div>
              <Button onClick={() => copy(shareLink, "লিংক")} variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
              <Button onClick={share} size="sm" className="bg-gold-button font-bold text-[var(--background)]">
                <Share2 className="h-4 w-4" /> শেয়ার
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40">
          <CardHeader><CardTitle className="text-white">আপনার রেফার করা ইউজার</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loadingRefs ? (
              <div className="text-sm text-white/60">লোড হচ্ছে…</div>
            ) : referred.length === 0 ? (
              <div className="rounded-md border border-dashed border-white/15 p-6 text-center text-sm text-white/60">
                এখনো কেউ আপনার কোড ব্যবহার করেনি। আপনার লিংক শেয়ার করে শুরু করুন!
              </div>
            ) : (
              referred.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md border border-white/10 bg-black/30 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{r.display_name || r.username || "User"}</div>
                    <div className="text-xs text-white/50">{new Date(r.created_at).toLocaleDateString("bn-BD")}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[var(--neon-green)]">৳ {r.deposits.toFixed(2)}</div>
                    <div className="text-xs text-[var(--neon-gold)]">+৳ {(r.deposits * COMMISSION_RATE).toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}

function StatCard({ icon, label, value, gold }: { icon: React.ReactNode; label: string; value: string; gold?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${gold ? "border-[var(--neon-gold)]/50 bg-[var(--neon-gold)]/10" : "border-white/10 bg-black/40"}`}>
      <div className={`flex items-center gap-2 text-xs ${gold ? "text-[var(--neon-gold)]" : "text-white/70"}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-1 text-xl font-black ${gold ? "text-[var(--neon-gold)]" : "text-white"}`}>{value}</div>
    </div>
  );
}
