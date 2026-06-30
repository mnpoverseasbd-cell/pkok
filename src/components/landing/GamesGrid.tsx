import { useState } from "react";
import { Play, Flame } from "lucide-react";
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

type Game = { name: string; img: string; cat: string; tag?: string };

const games: Game[] = [
  { name: "লাকি ৭৭৭", img: g1, cat: "slots", tag: "HOT" },
  { name: "নিয়ন রুলেট", img: g2, cat: "table" },
  { name: "রকেট ক্র্যাশ", img: g3, cat: "crash", tag: "NEW" },
  { name: "গোল্ড ফিশ", img: g4, cat: "fishing" },
  { name: "লাইভ ব্যাকারাট", img: g5, cat: "live" },
  { name: "ড্রাগন টাইগার", img: g6, cat: "live", tag: "HOT" },
  { name: "মেগা ফরচুন", img: g7, cat: "slots" },
  { name: "এভিয়েটর", img: g8, cat: "crash", tag: "HOT" },
  { name: "রয়েল পোকার", img: g9, cat: "table" },
  { name: "লাকি ডাইস", img: g10, cat: "table" },
  { name: "সুইট ক্যান্ডি", img: g11, cat: "slots", tag: "NEW" },
  { name: "ফারাও স্লট", img: g12, cat: "slots" },
];

const tabs = [
  { id: "all", label: "সব গেম" },
  { id: "slots", label: "স্লট" },
  { id: "live", label: "লাইভ ক্যাসিনো" },
  { id: "crash", label: "ক্র্যাশ" },
  { id: "fishing", label: "ফিশিং" },
  { id: "table", label: "টেবিল গেম" },
];

export function GamesGrid() {
  const [active, setActive] = useState("all");
  const filtered = active === "all" ? games : games.filter((g) => g.cat === active);

  return (
    <section id="games" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--neon-pink)]">
            <Flame className="h-3.5 w-3.5" /> জনপ্রিয় গেম
          </div>
          <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl">
            আপনার পছন্দের <span className="text-gradient-neon">গেম খেলুন</span>
          </h2>
        </div>
        <a href="#" className="text-sm font-bold text-[var(--neon-cyan)] hover:underline">
          সব দেখুন →
        </a>
      </div>

      <div className="mb-8 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
              active === t.id
                ? "bg-gradient-neon text-white glow-purple"
                : "border border-border bg-secondary/40 text-foreground/70 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
        {filtered.map((g) => (
          <div
            key={g.name}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-[var(--neon-purple)] hover:glow-purple"
          >
            <img
              src={g.img}
              alt={g.name}
              width={512}
              height={512}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            {g.tag && (
              <span
                className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-black ${
                  g.tag === "HOT"
                    ? "bg-[var(--neon-pink)] text-white"
                    : "bg-[var(--neon-cyan)] text-[var(--background)]"
                }`}
              >
                {g.tag}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 p-3">
              <h3 className="truncate text-sm font-bold text-white">{g.name}</h3>
              <button className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md bg-gradient-gold py-1.5 text-xs font-black text-[var(--background)] opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="h-3 w-3 fill-current" /> PLAY
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
