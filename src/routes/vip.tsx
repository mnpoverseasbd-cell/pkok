import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Diamond, Gem, Gift, Headphones, Sparkles, Star, Trophy, Wallet } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/vip")({
  head: () => ({
    meta: [
      { title: "VIP ক্লাব — Asik Game" },
      { name: "description", content: "Asik Game VIP প্রোগ্রাম — Bronze থেকে Diamond পর্যন্ত লেভেল, এক্সক্লুসিভ ক্যাশব্যাক, ব্যক্তিগত ম্যানেজার ও বিশেষ গিফট।" },
      { property: "og:title", content: "VIP ক্লাব — Asik Game" },
      { property: "og:description", content: "VIP লেভেল আপ করুন এবং পান প্রিমিয়াম রিওয়ার্ড, ফাস্ট উত্তোলন ও এক্সক্লুসিভ বোনাস।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VipPage,
});

type TierKey = "bronze" | "silver" | "gold" | "platinum" | "diamond";

const tiers: {
  key: TierKey;
  name: string;
  icon: typeof Star;
  color: string;
  cashback: string;
  rebate: string;
  requirement: number; // BDT lifetime approved deposits
  featured?: boolean;
}[] = [
  { key: "bronze",   name: "Bronze",   icon: Star,      color: "from-amber-700 to-amber-500",   cashback: "3%",  rebate: "0.5%", requirement: 0 },
  { key: "silver",   name: "Silver",   icon: Sparkles,  color: "from-slate-400 to-slate-200",   cashback: "5%",  rebate: "0.8%", requirement: 25_000 },
  { key: "gold",     name: "Gold",     icon: Crown,     color: "from-yellow-400 to-amber-600",  cashback: "8%",  rebate: "1.2%", requirement: 100_000, featured: true },
  { key: "platinum", name: "Platinum", icon: Gem,       color: "from-cyan-300 to-sky-500",      cashback: "12%", rebate: "1.5%", requirement: 500_000 },
  { key: "diamond",  name: "Diamond",  icon: Diamond,   color: "from-fuchsia-400 to-purple-700", cashback: "18%", rebate: "2%",   requirement: 2_500_000 },
];

const perks = [
  { icon: Wallet, t: "দ্রুত উত্তোলন", b: "VIP সদস্যদের জন্য মাত্র ৫ মিনিটে উত্তোলন প্রসেস।" },
  { icon: Gift, t: "জন্মদিন গিফট", b: "প্রতি জন্মদিনে এক্সক্লুসিভ বোনাস ও বিশেষ উপহার।" },
  { icon: Headphones, t: "ব্যক্তিগত ম্যানেজার", b: "ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার ২৪/৭ সাপোর্ট দেবে।" },
  { icon: Trophy, t: "এক্সক্লুসিভ টুর্নামেন্ট", b: "শুধু VIP-দের জন্য বিশেষ টুর্নামেন্ট ও জ্যাকপট।" },
];

function computeTier(lifetimeDeposits: number) {
  let current = tiers[0];
  for (const t of tiers) {
    if (lifetimeDeposits >= t.requirement) current = t;
  }
  const currentIdx = tiers.findIndex((t) => t.key === current.key);
  const next = tiers[currentIdx + 1] ?? null;
  const progressPct = next
    ? Math.min(100, Math.max(0, ((lifetimeDeposits - current.requirement) / (next.requirement - current.requirement)) * 100))
    : 100;
  const remaining = next ? Math.max(0, next.requirement - lifetimeDeposits) : 0;
  return { current, next, progressPct, remaining };
}

function VipPage() {
  const { user } = useAuth();
  const [lifetime, setLifetime] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setLifetime(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "deposit")
        .eq("status", "approved");
      if (cancelled) return;
      const total = (data ?? []).reduce((a, r) => a + Number(r.amount ?? 0), 0);
      setLifetime(total);

    })();
    return () => { cancelled = true; };
  }, [user]);

  const progress = lifetime !== null ? computeTier(lifetime) : null;

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pt-4 sm:px-4 lg:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--neon-gold)]/45 panel-dark p-6 text-center sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,214,54,0.25),transparent_55%)]" />
          <div className="relative">
            <Crown className="mx-auto h-12 w-12 text-[var(--neon-gold)]" />
            <h1 className="mt-2 text-4xl font-black text-white sm:text-6xl">
              <span className="text-gradient-gold">ASIK VIP</span> ক্লাব
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-foreground/80 sm:text-base">
              আপনার গেমিং অভিজ্ঞতা পৌঁছে দিন এক নতুন উচ্চতায় — পান এক্সক্লুসিভ ক্যাশব্যাক, ব্যক্তিগত ম্যানেজার এবং প্রিমিয়াম রিওয়ার্ড।
            </p>
            {progress && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 ring-1 ring-[var(--neon-gold)]/50">
                <progress.current.icon className="h-4 w-4 text-[var(--neon-gold)]" />
                <span className="text-sm font-bold text-white">আপনার লেভেল:</span>
                <span className="text-sm font-black text-gradient-gold">{progress.current.name}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {tiers.map((tier) => {
            const isCurrent = progress?.current.key === tier.key;
            return (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-4 text-center transition ${
                  isCurrent
                    ? "border-[var(--neon-green)] panel-dark scale-[1.05] shadow-[0_0_30px_rgba(56,255,145,0.35)]"
                    : tier.featured
                    ? "border-[var(--neon-gold)] panel-dark shadow-[0_0_30px_rgba(255,214,54,0.25)]"
                    : "border-[var(--neon-green)]/40 bg-black/30"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--neon-green)] px-3 py-0.5 text-[10px] font-black text-black">
                    আপনি এখানে
                  </div>
                )}
                <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${tier.color}`}>
                  <tier.icon className="h-8 w-8 text-white" />
                </div>
                <div className="mt-3 text-xl font-black text-gradient-gold">{tier.name}</div>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-foreground/70">ক্যাশব্যাক</span><span className="font-bold text-[var(--neon-green)]">{tier.cashback}</span></div>
                  <div className="flex justify-between"><span className="text-foreground/70">রিবেট</span><span className="font-bold text-[var(--neon-cyan)]">{tier.rebate}</span></div>
                  <div className="flex justify-between"><span className="text-foreground/70">প্রয়োজন</span><span className="font-bold text-white">৳{tier.requirement.toLocaleString()}</span></div>
                </div>
                {tier.featured && !isCurrent && <div className="mt-3 rounded-full bg-gold-button px-3 py-1 text-xs font-black text-[var(--background)]">জনপ্রিয়</div>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 pb-6 sm:px-4 lg:px-6">
        <div className="rounded-2xl inset-panel p-4 sm:p-6">
          <h2 className="mb-4 text-2xl font-black text-gradient-gold">আপনার VIP অগ্রগতি</h2>
          {!user ? (
            <div className="rounded-xl bg-black/35 p-6 text-center">
              <p className="text-foreground/80">আপনার VIP progress দেখতে <Link to="/login" className="font-black text-[var(--neon-gold)] underline">লগইন</Link> করুন।</p>
            </div>
          ) : lifetime === null ? (
            <div className="rounded-xl bg-black/35 p-6 text-center text-foreground/70">Loading…</div>
          ) : progress ? (
            <div className="rounded-xl bg-black/35 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-white">
                  {progress.current.name}
                  {progress.next && <> → <span className="text-[var(--neon-gold)]">{progress.next.name}</span></>}
                </span>
                <span className="text-foreground/75">
                  ৳{lifetime.toLocaleString()} {progress.next && <>/ ৳{progress.next.requirement.toLocaleString()}</>}
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--neon-green)] to-[var(--neon-gold)] transition-all duration-700"
                  style={{ width: `${progress.progressPct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-foreground/70">
                {progress.next
                  ? <>{progress.next.name} লেভেলে পৌঁছাতে আর প্রয়োজন ৳{progress.remaining.toLocaleString()}</>
                  : <>🎉 আপনি সর্বোচ্চ লেভেলে পৌঁছেছেন!</>}
              </div>
              <div className="mt-3 text-[11px] text-foreground/50">
                * lifetime approved deposit-এর উপর ভিত্তি করে গণনা।
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 pb-8 sm:px-4 lg:px-6">
        <h2 className="mb-4 text-2xl font-black text-gradient-gold">VIP সুবিধাসমূহ</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p) => (
            <div key={p.t} className="rounded-2xl border border-[var(--neon-green)]/40 bg-black/30 p-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-green-button text-[var(--background)]"><p.icon className="h-6 w-6" /></span>
              <h3 className="mt-3 text-lg font-black text-[var(--neon-gold)]">{p.t}</h3>
              <p className="mt-1 text-sm text-foreground/80">{p.b}</p>
            </div>
          ))}
        </div>
        {!user && (
          <div className="mt-6 text-center">
            <Link to="/register" className="inline-flex rounded-full bg-gold-button px-8 py-3 text-base font-black text-[var(--background)]">VIP জয়েন করুন</Link>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
