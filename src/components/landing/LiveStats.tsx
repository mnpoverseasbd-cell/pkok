import { Users, Trophy, Gamepad2, Wallet } from "lucide-react";

const stats = [
  { icon: Users, label: "একটিভ প্লেয়ার", value: "৫,৮২,৪৩৭", accent: "text-[var(--neon-cyan)]" },
  { icon: Wallet, label: "মোট পেআউট", value: "৳১২০ কোটি+", accent: "text-[var(--neon-gold)]" },
  { icon: Gamepad2, label: "গেমস", value: "১,২০০+", accent: "text-[var(--neon-purple)]" },
  { icon: Trophy, label: "আজকের বিজয়ী", value: "৮,৯২৪", accent: "text-[var(--neon-pink)]" },
];

export function LiveStats() {
  return (
    <section className="relative border-y border-border/60 bg-[var(--surface)]/40 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:gap-6 lg:px-8">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3 sm:gap-4">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary/60 ${s.accent} sm:h-12 sm:w-12`}>
              <s.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <div className="min-w-0">
              <div className={`font-display text-lg font-black sm:text-2xl ${s.accent}`}>{s.value}</div>
              <div className="truncate text-xs text-foreground/70 sm:text-sm">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
