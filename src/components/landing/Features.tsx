import { ShieldCheck, Zap, Headphones, Trophy } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "নিরাপদ ও বিশ্বস্ত",
    desc: "১২৮-বিট SSL এনক্রিপশন ও আন্তর্জাতিক লাইসেন্স প্রাপ্ত প্ল্যাটফর্ম",
    color: "text-[var(--neon-cyan)]",
    bg: "bg-[var(--neon-cyan)]/10",
  },
  {
    icon: Zap,
    title: "দ্রুত উত্তোলন",
    desc: "মাত্র ৫ মিনিটে উত্তোলন — bKash, Nagad, Rocket সব মাধ্যমে",
    color: "text-[var(--neon-gold)]",
    bg: "bg-[var(--neon-gold)]/10",
  },
  {
    icon: Headphones,
    title: "২৪/৭ লাইভ সাপোর্ট",
    desc: "বাংলা ভাষায় ২৪ ঘণ্টা প্রফেশনাল কাস্টমার সাপোর্ট টিম",
    color: "text-[var(--neon-purple)]",
    bg: "bg-[var(--neon-purple)]/10",
  },
  {
    icon: Trophy,
    title: "বিশাল জ্যাকপট",
    desc: "প্রতিদিন কোটি টাকার জ্যাকপট ও মিলিয়ন ডলার পুরস্কার",
    color: "text-[var(--neon-pink)]",
    bg: "bg-[var(--neon-pink)]/10",
  },
];

export function Features() {
  return (
    <section id="support" className="relative bg-[var(--surface)]/40 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--neon-purple)]">
            কেন আমরা সেরা
          </div>
          <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl">
            কেন <span className="text-gradient-gold">ASIK GAME</span>?
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:border-[var(--neon-purple)]/50 hover:glow-purple"
            >
              <div className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl ${f.bg} ${f.color} transition-transform group-hover:scale-110`}>
                <f.icon className="h-8 w-8" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-foreground/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
