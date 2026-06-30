import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Gift, Sparkles, Tag, Trophy, Wallet } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/promotion")({
  head: () => ({
    meta: [
      { title: "প্রমোশন — Asik Game" },
      { name: "description", content: "Asik Game-এর সমস্ত চলমান প্রমোশন, বোনাস, ওয়েলকাম অফার, ক্যাশব্যাক ও স্পেশাল ইভেন্ট এক জায়গায়।" },
      { property: "og:title", content: "প্রমোশন — Asik Game" },
      { property: "og:description", content: "ওয়েলকাম বোনাস, ডেইলি রিওয়ার্ড, VIP ক্যাশব্যাক এবং বিশেষ ইভেন্ট প্রমোশন।" },
    ],
  }),
  component: PromotionPage,
});

const tabs = ["সব", "ওয়েলকাম", "ডেইলি", "স্লট", "লাইভ", "স্পোর্টস", "VIP"];

const promos = [
  { tag: "WELCOME", color: "from-[var(--neon-gold)] to-[var(--neon-pink)]", title: "৯৫০% স্বাগতম বোনাস", body: "নতুন রেজিস্ট্রেশনে সর্বোচ্চ ৩০,০০০ টাকা পর্যন্ত মিলান বোনাস।", expires: "31 Dec 2026" },
  { tag: "DAILY", color: "from-[var(--neon-green)] to-[var(--neon-cyan)]", title: "দৈনিক ১০০% রিচার্জ বোনাস", body: "প্রথম ডিপোজিটে ১০০% — bKash, Nagad, Rocket সব মাধ্যমে।", expires: "চলমান" },
  { tag: "CASHBACK", color: "from-[var(--neon-purple)] to-[var(--neon-pink)]", title: "সাপ্তাহিক ১৫% ক্যাশব্যাক", body: "প্রতি সোমবার আপনার নেট লসের ১৫% ক্যাশব্যাক হিসেবে ফিরিয়ে নিন।", expires: "চলমান" },
  { tag: "SLOTS", color: "from-[var(--neon-gold)] to-[var(--neon-green)]", title: "স্লট টুর্নামেন্ট ৳১০ লাখ", body: "প্রতি সপ্তাহে শীর্ষ ১০০ জনের জন্য প্রাইজ পুল ১০ লাখ টাকা।", expires: "07 Jul 2026" },
  { tag: "LIVE", color: "from-[var(--neon-pink)] to-[var(--neon-gold)]", title: "লাইভ ক্যাসিনো ৫% রিবেট", body: "লাইভ গেমে প্রতিদিন আনলিমিটেড ৫% রিবেট নিশ্চিত।", expires: "চলমান" },
  { tag: "SPORTS", color: "from-[var(--neon-cyan)] to-[var(--neon-purple)]", title: "স্পোর্টস বুস্ট ২০০%", body: "ফুটবল ও ক্রিকেট পার্লে ২০০% পর্যন্ত উইনিং বুস্ট।", expires: "চলমান" },
  { tag: "REFER", color: "from-[var(--neon-green)] to-[var(--neon-gold)]", title: "রেফার করে ৳৫০০ পান", body: "বন্ধুকে রেফার করুন এবং প্রতি একটিভ রেফারেলে ৳৫০০ বোনাস।", expires: "চলমান" },
  { tag: "VIP", color: "from-[var(--neon-purple)] to-[var(--neon-cyan)]", title: "VIP জন্মদিন বোনাস", body: "VIP সদস্যদের জন্মদিনে এক্সক্লুসিভ গিফট ও ফ্রি স্পিন।", expires: "চলমান" },
];

function PromotionPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pt-3 sm:px-4 lg:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--neon-green)]/45">
          <img src={heroBg} alt="" className="h-40 w-full object-cover sm:h-56" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/70" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <Sparkles className="mb-2 h-6 w-6 text-[var(--neon-gold)]" />
            <h1 className="text-3xl font-black text-white sm:text-5xl">
              <span className="text-gradient-gold">প্রমোশন</span> ও বোনাস
            </h1>
            <p className="mt-2 max-w-xl text-xs text-white/80 sm:text-sm">এক্সক্লুসিভ অফার, ক্যাশব্যাক, ফ্রি স্পিন আর VIP বোনাস — সবকিছু এক জায়গায়।</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 pt-5 sm:px-4 lg:px-6">
        <div className="flex gap-2 overflow-x-auto rounded-2xl inset-panel p-2">
          {tabs.map((t, i) => (
            <button key={t} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${i === 0 ? "bg-green-button text-[var(--background)]" : "bg-black/30 text-white/80 hover:bg-[var(--neon-green)]/30 hover:text-white"}`}>{t}</button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((p) => (
            <article key={p.title} className="group overflow-hidden rounded-2xl border border-[var(--neon-green)]/45 panel-dark transition hover:-translate-y-1 hover:border-[var(--neon-gold)]/60">
              <div className={`relative h-32 bg-gradient-to-br ${p.color}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35),transparent_60%)]" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-[10px] font-black text-white"><Tag className="h-3 w-3" />{p.tag}</span>
                <Gift className="absolute right-3 bottom-3 h-12 w-12 text-white/85 drop-shadow" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-black text-gradient-gold">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground/80">{p.body}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-foreground/70">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {p.expires}</span>
                  <button className="rounded-full bg-green-button px-4 py-1.5 font-black text-[var(--background)]">বিস্তারিত</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 pb-8 sm:px-4 lg:px-6">
        <div className="grid gap-3 rounded-2xl inset-panel p-4 sm:grid-cols-3">
          {[
            { icon: Wallet, t: "৳১২০ কোটি+", s: "মোট বোনাস পেআউট" },
            { icon: Trophy, t: "৮,৯২৪", s: "আজকের বিজয়ী" },
            { icon: Gift, t: "৩৬+", s: "চলমান প্রমোশন" },
          ].map((s) => (
            <div key={s.s} className="flex items-center gap-3 rounded-xl bg-black/30 p-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-green-button text-[var(--background)]"><s.icon className="h-6 w-6" /></span>
              <div>
                <div className="text-2xl font-black text-[var(--neon-gold)]">{s.t}</div>
                <div className="text-xs text-foreground/75">{s.s}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link to="/register" className="inline-flex rounded-full bg-gold-button px-8 py-3 text-base font-black text-[var(--background)]">এখনই জয়েন করুন</Link>
        </div>
      </section>
    </SiteShell>
  );
}
