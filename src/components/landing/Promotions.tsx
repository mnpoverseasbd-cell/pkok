import { Gift, Calendar, Sparkles, Crown } from "lucide-react";

const promos = [
  {
    icon: Gift,
    title: "ওয়েলকাম বোনাস",
    amount: "২০০%",
    desc: "প্রথম ডিপোজিটে ২০০% পর্যন্ত ৳২০,০০০ বোনাস পান",
    cta: "ক্লেইম করুন",
    grad: "from-[var(--neon-gold)] to-orange-500",
    accent: "text-[var(--neon-gold)]",
  },
  {
    icon: Calendar,
    title: "ডেইলি রিওয়ার্ড",
    amount: "৳৫০০",
    desc: "প্রতিদিন লগইন করে পান গ্যারান্টিড ক্যাশব্যাক রিওয়ার্ড",
    cta: "ক্লেইম করুন",
    grad: "from-[var(--neon-purple)] to-[var(--neon-pink)]",
    accent: "text-[var(--neon-pink)]",
  },
  {
    icon: Sparkles,
    title: "সুপার রিওয়ার্ড ইভেন্ট",
    amount: "৳১০ লাখ",
    desc: "সাপ্তাহিক টুর্নামেন্ট — সেরা প্লেয়ারদের জন্য বিশাল পুরস্কার",
    cta: "অংশ নিন",
    grad: "from-[var(--neon-cyan)] to-blue-500",
    accent: "text-[var(--neon-cyan)]",
  },
  {
    icon: Crown,
    title: "VIP ক্যাশব্যাক",
    amount: "১৫%",
    desc: "VIP মেম্বারদের জন্য সাপ্তাহিক ১৫% আনলিমিটেড ক্যাশব্যাক",
    cta: "VIP হোন",
    grad: "from-pink-500 to-red-600",
    accent: "text-[var(--neon-pink)]",
  },
];

export function Promotions() {
  return (
    <section id="promo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mb-10 text-center">
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--neon-gold)]">
          <Gift className="h-3.5 w-3.5" /> এক্সক্লুসিভ অফার
        </div>
        <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl">
          প্রমোশন ও <span className="text-gradient-gold">বোনাস</span>
        </h2>
        <p className="mt-3 text-foreground/70">প্রতিদিন নতুন বোনাস ও পুরস্কার জিতুন</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {promos.map((p) => (
          <div
            key={p.title}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-[var(--neon-purple)]/60"
          >
            <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${p.grad} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />
            <div className={`relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.grad} text-white`}>
              <p.icon className="h-6 w-6" />
            </div>
            <div className={`relative font-display text-3xl font-black ${p.accent}`}>{p.amount}</div>
            <h3 className="relative mt-1 text-lg font-bold">{p.title}</h3>
            <p className="relative mt-2 text-sm text-foreground/70">{p.desc}</p>
            <button className="relative mt-4 w-full rounded-lg border border-border bg-secondary/40 py-2 text-sm font-bold transition-colors group-hover:bg-gradient-neon group-hover:text-white">
              {p.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
