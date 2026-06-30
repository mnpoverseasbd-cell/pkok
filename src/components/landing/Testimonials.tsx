import { Star, Quote } from "lucide-react";

const reviews = [
  {
    name: "রাকিব হাসান",
    city: "ঢাকা",
    text: "অসাধারণ প্ল্যাটফর্ম! মাত্র ৩ মিনিটে আমার ৫০,০০০ টাকা bKash এ পেয়ে গেছি। সাপোর্ট টিম দারুণ।",
    avatar: "RH",
    grad: "from-[var(--neon-purple)] to-[var(--neon-pink)]",
  },
  {
    name: "সাবরিনা আক্তার",
    city: "চট্টগ্রাম",
    text: "ওয়েলকাম বোনাস দিয়ে শুরু করেছিলাম, এখন প্রতি সপ্তাহে ভালো পরিমাণ জিতছি। গেমগুলো খুবই smooth।",
    avatar: "SA",
    grad: "from-[var(--neon-cyan)] to-blue-600",
  },
  {
    name: "তানভীর আহমেদ",
    city: "সিলেট",
    text: "VIP মেম্বারশিপ নেওয়ার পর থেকে ক্যাশব্যাক ও স্পেশাল ইভেন্ট সবকিছুতে দারুণ এক্সপেরিয়েন্স পাচ্ছি।",
    avatar: "TA",
    grad: "from-[var(--neon-gold)] to-orange-500",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mb-12 text-center">
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--neon-pink)]">
          ইউজার রিভিউ
        </div>
        <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl">
          আমাদের <span className="text-gradient-neon">প্লেয়াররা যা বলেন</span>
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {reviews.map((r) => (
          <div
            key={r.name}
            className="relative rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-[var(--neon-purple)]/50"
          >
            <Quote className="absolute right-4 top-4 h-8 w-8 text-[var(--neon-purple)]/30" />
            <div className="mb-3 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-[var(--neon-gold)] text-[var(--neon-gold)]" />
              ))}
            </div>
            <p className="text-sm leading-relaxed text-foreground/85">"{r.text}"</p>
            <div className="mt-5 flex items-center gap-3">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${r.grad} font-display text-sm font-black text-white`}>
                {r.avatar}
              </div>
              <div className="min-w-0">
                <div className="truncate font-bold">{r.name}</div>
                <div className="text-xs text-foreground/60">{r.city}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
