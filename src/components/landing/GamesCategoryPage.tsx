import { useState } from "react";
import { Filter, Flame, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/landing/SiteShell";
import g1 from "@/assets/game-slot1.jpg";
import g2 from "@/assets/game-roulette.jpg";
import g3 from "@/assets/game-crash.jpg";
import g4 from "@/assets/game-fishing.jpg";
import g5 from "@/assets/game-baccarat.jpg";
import g6 from "@/assets/game-dragon.jpg";
import g7 from "@/assets/game-fortune.jpg";
import g8 from "@/assets/game-aviator.jpg";
import g9 from "@/assets/game-poker.jpg";
import g10 from "@/assets/game-dice.jpg";
import g11 from "@/assets/game-candy.jpg";
import g12 from "@/assets/game-pharaoh.jpg";

export type CategoryId = "hot" | "slots" | "live" | "fishing" | "sports" | "crash" | "poker" | "lottery";

export const categoryNav: { id: CategoryId; label: string; to: string }[] = [
  { id: "hot", label: "🔥 হট", to: "/games" },
  { id: "slots", label: "স্লট", to: "/slots" },
  { id: "live", label: "লাইভ", to: "/live" },
  { id: "fishing", label: "ফিশিং", to: "/fishing" },
  { id: "sports", label: "স্পোর্টস", to: "/sports" },
  { id: "crash", label: "ক্র্যাশ", to: "/crash" },
  { id: "poker", label: "পোকার", to: "/poker" },
  { id: "lottery", label: "লটারি", to: "/lottery" },
];

const providers = ["সব", "PG", "JILI", "Pragmatic", "Evolution", "JDB", "CQ9", "Spribe"];

export const lib: Record<CategoryId, { title: string; image: string; provider: string; tag?: string }[]> = {
  hot: [
    { title: "Aviator", image: g8, provider: "Spribe", tag: "HOT" },
    { title: "Super Win", image: g1, provider: "PG" },
    { title: "Olympus", image: g12, provider: "Pragmatic", tag: "NEW" },
    { title: "Mega Rich", image: g11, provider: "JILI" },
    { title: "Crash X", image: g3, provider: "Spribe" },
    { title: "Lucky Fortune", image: g7, provider: "PG" },
  ],
  slots: [
    { title: "Sweet Candy", image: g11, provider: "Pragmatic" },
    { title: "Fortune Tiger", image: g7, provider: "PG" },
    { title: "Pharaoh Riches", image: g12, provider: "JILI", tag: "HOT" },
    { title: "Dragon Hatch", image: g6, provider: "PG" },
    { title: "Mega Slot", image: g1, provider: "JDB" },
    { title: "Money Coin", image: g9, provider: "JILI" },
  ],
  live: [
    { title: "Speed Baccarat", image: g5, provider: "Evolution" },
    { title: "Lightning Roulette", image: g2, provider: "Evolution", tag: "HOT" },
    { title: "Dragon Tiger", image: g6, provider: "Evolution" },
    { title: "Sic Bo", image: g10, provider: "Pragmatic" },
  ],
  fishing: [
    { title: "Fish Hunter", image: g4, provider: "JILI" },
    { title: "Mega Fishing", image: g4, provider: "JDB", tag: "NEW" },
    { title: "Royal Fish", image: g4, provider: "CQ9" },
    { title: "Fish Pirates", image: g4, provider: "JILI" },
  ],
  sports: [
    { title: "Football Live", image: g8, provider: "Evolution" },
    { title: "Cricket Pro", image: g10, provider: "Pragmatic" },
    { title: "Tennis Open", image: g8, provider: "Evolution" },
  ],
  crash: [
    { title: "Aviator", image: g8, provider: "Spribe", tag: "HOT" },
    { title: "Crash X", image: g3, provider: "Spribe" },
    { title: "Mines", image: g10, provider: "Spribe" },
  ],
  poker: [
    { title: "Texas Holdem", image: g9, provider: "JILI" },
    { title: "Video Poker", image: g9, provider: "CQ9" },
  ],
  lottery: [
    { title: "Lucky Lotto", image: g7, provider: "JILI" },
    { title: "Bingo Bash", image: g11, provider: "PG" },
  ],
};

export function GamesCategoryPage({ category, title, subtitle }: { category: CategoryId; title: string; subtitle: string }) {
  const [provider, setProvider] = useState("সব");
  const [q, setQ] = useState("");

  let games = lib[category] ?? [];
  if (provider !== "সব") games = games.filter((g) => g.provider === provider);
  if (q.trim()) games = games.filter((g) => g.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pt-4 sm:px-4 lg:px-6">
        <div className="rounded-2xl inset-panel p-4">
          <div className="flex items-center gap-2 text-lg font-black text-[var(--neon-gold)]">
            <Flame className="h-5 w-5" /> {title}
          </div>
          <p className="mt-1 text-sm text-foreground/75">{subtitle}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-2 rounded-full border border-[var(--neon-green)]/45 bg-black/35 px-3 py-2">
              <Search className="h-4 w-4 text-foreground/70" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="গেম সার্চ করুন..." className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/50" />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="h-4 w-4 shrink-0 text-foreground/70" />
              {providers.map((p) => (
                <button key={p} onClick={() => setProvider(p)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${provider === p ? "bg-gold-button text-[var(--background)]" : "bg-black/30 text-white/80 hover:bg-[var(--neon-green)]/30"}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 pt-4 sm:px-4 lg:px-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categoryNav.map((c) => (
            <Link
              key={c.id}
              to={c.to}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${category === c.id ? "bg-green-button text-[var(--background)]" : "bg-black/35 text-white/85 border border-[var(--neon-green)]/35 hover:bg-[var(--neon-green)]/30"}`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-5 sm:px-4 lg:px-6">
        {games.length === 0 ? (
          <div className="rounded-2xl inset-panel p-10 text-center text-foreground/70">কোনো গেম খুঁজে পাওয়া যায়নি।</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {games.map((g, i) => (
              <div key={`${g.title}-${i}`} className="game-frame group relative overflow-hidden rounded-2xl p-1.5 transition hover:-translate-y-1">
                {g.tag && <span className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-black ${g.tag === "HOT" ? "bg-[var(--neon-pink)] text-white" : "bg-[var(--neon-gold)] text-[var(--background)]"}`}>{g.tag}</span>}
                <img src={g.image} alt={g.title} loading="lazy" className="aspect-[0.82/1] w-full rounded-xl object-cover transition-transform group-hover:scale-105" />
                <div className="px-1 pb-1 pt-2">
                  <div className="truncate text-xs font-bold text-white sm:text-sm">{g.title}</div>
                  <div className="truncate text-[10px] text-foreground/60">{g.provider}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
