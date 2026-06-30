import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Diamond, Gem, Gift, Headphones, Sparkles, Star, Trophy, Wallet } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";

export const Route = createFileRoute("/vip")({
  head: () => ({
    meta: [
      { title: "VIP ক্লাব — Asik Game" },
      { name: "description", content: "Asik Game VIP প্রোগ্রাম — Bronze থেকে Diamond পর্যন্ত লেভেল, এক্সক্লুসিভ ক্যাশব্যাক, ব্যক্তিগত ম্যানেজার ও বিশেষ গিফট।" },
      { property: "og:title", content: "VIP ক্লাব — Asik Game" },
      { property: "og:description", content: "VIP লেভেল আপ করুন এবং পান প্রিমিয়াম রিওয়ার্ড, ফাস্ট উত্তোলন ও এক্সক্লুসিভ বোনাস।" },
    ],
  }),
  component: VipPage,
});

const tiers = [
  { name: "Bronze", icon: Star, color: "from-amber-700 to-amber-500", cashback: "3%", rebate: "0.5%", deposit: "৳ 5,000" },
  { name: "Silver", icon: Sparkles, color: "from-slate-400 to-slate-200", cashback: "5%", rebate: "0.8%", deposit: "৳ 25,000" },
  { name: "Gold", icon: Crown, color: "from-yellow-400 to-amber-600", cashback: "8%", rebate: "1.2%", deposit: "৳ 1,00,000", featured: true },
  { name: "Platinum", icon: Gem, color: "from-cyan-300 to-sky-500", cashback: "12%", rebate: "1.5%", deposit: "৳ 5,00,000" },
  { name: "Diamond", icon: Diamond, color: "from-fuchsia-400 to-purple-700", cashback: "18%", rebate: "2%", deposit: "৳ 25,00,000" },
];

const perks = [
  { icon: Wallet, t: "দ্রুত উত্তোলন", b: "VIP সদস্যদের জন্য মাত্র ৫ মিনিটে উত্তোলন প্রসেস।" },
  { icon: Gift, t: "জন্মদিন গিফট", b: "প্রতি জন্মদিনে এক্সক্লুসিভ বোনাস ও বিশেষ উপহার।" },
  { icon: Headphones, t: "ব্যক্তিগত ম্যানেজার", b: "ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার ২৪/৭ সাপোর্ট দেবে।" },
  { icon: Trophy, t: "এক্সক্লুসিভ টুর্নামেন্ট", b: "শুধু VIP-দের জন্য বিশেষ টুর্নামেন্ট ও জ্যাকপট।" },
];

function VipPage() {
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
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {tiers.map((tier) => (
            <div key={tier.name} className={`rounded-2xl border p-4 text-center transition ${tier.featured ? "border-[var(--neon-gold)] panel-dark scale-[1.03] shadow-[0_0_30px_rgba(255,214,54,0.25)]" : "border-[var(--neon-green)]/40 bg-black/30"}`}>
              <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${tier.color}`}>
                <tier.icon className="h-8 w-8 text-white" />
              </div>
              <div className="mt-3 text-xl font-black text-gradient-gold">{tier.name}</div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-foreground/70">ক্যাশব্যাক</span><span className="font-bold text-[var(--neon-green)]">{tier.cashback}</span></div>
                <div className="flex justify-between"><span className="text-foreground/70">রিবেট</span><span className="font-bold text-[var(--neon-cyan)]">{tier.rebate}</span></div>
                <div className="flex justify-between"><span className="text-foreground/70">প্রয়োজন</span><span className="font-bold text-white">{tier.deposit}</span></div>
              </div>
              {tier.featured && <div className="mt-3 rounded-full bg-gold-button px-3 py-1 text-xs font-black text-[var(--background)]">জনপ্রিয়</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 pb-6 sm:px-4 lg:px-6">
        <div className="rounded-2xl inset-panel p-4 sm:p-6">
          <h2 className="mb-4 text-2xl font-black text-gradient-gold">আপনার VIP অগ্রগতি</h2>
          <div className="rounded-xl bg-black/35 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-white">Silver → Gold</span>
              <span className="text-foreground/75">৳ 18,400 / ৳ 1,00,000</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/50">
              <div className="h-full w-[18%] rounded-full bg-gradient-to-r from-[var(--neon-green)] to-[var(--neon-gold)]" />
            </div>
            <div className="mt-2 text-xs text-foreground/70">Gold লেভেলে পৌঁছাতে আর প্রয়োজন ৳ 81,600</div>
          </div>
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
        <div className="mt-6 text-center">
          <Link to="/register" className="inline-flex rounded-full bg-gold-button px-8 py-3 text-base font-black text-[var(--background)]">VIP জয়েন করুন</Link>
        </div>
      </section>
    </SiteShell>
  );
}
