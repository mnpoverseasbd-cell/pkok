import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Gamepad2, Sparkles } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";

export const Route = createFileRoute("/esports")({
  head: () => ({
    meta: [
      { title: "আমার গেমস — Asik Game" },
      { name: "description", content: "Asik Game–এ তৈরি নিজস্ব অরিজিনাল গেমস।" },
      { property: "og:title", content: "আমার গেমস — Asik Game" },
      { property: "og:description", content: "শুধুমাত্র আমাদের নিজস্ব তৈরি করা গেমস এখানে খেলা যাবে।" },
    ],
  }),
  component: MyGamesPage,
});

// Add your custom-built games here as you create them.
// Each game should have its own route under src/routes/ (e.g. src/routes/games.dice.tsx).
type OriginalGame = {
  slug: string;
  name: string;
  tagline: string;
  emoji: string;
  gradient: string;
  status: "live" | "soon";
  to?: string;
};

const myGames: OriginalGame[] = [
  // Example placeholder — replace / extend as we build each game.
  // { slug: "dice",  name: "Lucky Dice",  tagline: "Predict & Win", emoji: "🎲", gradient: "from-emerald-500 to-teal-700", status: "live", to: "/games/dice" },
];

function MyGamesPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return myGames;
    return myGames.filter((g) => g.name.toLowerCase().includes(q) || g.slug.includes(q));
  }, [query]);

  return (
    <SiteShell>
      <h1 className="sr-only">আমার গেমস</h1>
      <section
        className="game-lobby MYGAMES"
        aria-label="Our original games"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(180,120,255,0.20), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(255,220,120,0.14), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        <div className="mx-auto mb-6 flex w-[1200px] max-w-[calc(100vw-96px)] flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(180deg,#0f5a34,#083f22)] px-4 py-2 ring-1 ring-[var(--neon-green)]/50">
            <Gamepad2 className="h-5 w-5 text-[var(--neon-gold)]" />
            <h2 className="text-base font-bold tracking-wide text-[var(--neon-gold)]">
              আমার নিজের তৈরি গেমস
            </h2>
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs font-bold text-white">
              <Sparkles className="h-3 w-3 text-[var(--neon-gold)]" />
              ORIGINALS · {myGames.length}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 ring-1 ring-black/10">
            <Search className="h-4 w-4 text-black/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="গেম খুঁজুন..."
              className="w-40 border-none bg-transparent text-sm text-black placeholder:text-black/40 focus:outline-none sm:w-56"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState hasQuery={query.trim().length > 0} />
        ) : (
          <div className="game-list" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
            {filtered.map((g, i) => (
              <GameCard key={g.slug} g={g} index={i} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function GameCard({ g, index }: { g: OriginalGame; index: number }) {
  const inner = (
    <div className="relative w-full overflow-hidden rounded-lg">
      <div
        className={`aspect-[4/3] w-full bg-gradient-to-br ${g.gradient} flex items-center justify-center text-6xl transition-transform duration-500 group-hover:scale-110`}
      >
        <span aria-hidden>{g.emoji}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
        <div className="text-sm font-bold text-white">{g.name}</div>
        <div className="text-[10px] text-white/70">{g.tagline}</div>
      </div>
      <span
        className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ring-white/40 backdrop-blur ${
          g.status === "live" ? "bg-red-600/90 text-white" : "bg-yellow-400/90 text-black"
        }`}
      >
        {g.status === "live" ? (
          <>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            LIVE
          </>
        ) : (
          "SOON"
        )}
      </span>
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-0 ring-[var(--neon-gold)] transition-all duration-300 group-hover:ring-2 group-hover:shadow-[0_10px_28px_rgba(255,215,80,0.35)]" />
    </div>
  );

  const className = "lobby-item group animate-fade-in";
  const style = { animationDelay: `${Math.min(index * 30, 600)}ms`, animationFillMode: "backwards" as const };

  if (g.status === "live" && g.to) {
    return (
      <Link to={g.to} className={className} style={style} aria-label={g.name}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={className} style={style} aria-label={g.name} disabled={g.status === "soon"}>
      {inner}
    </button>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  if (hasQuery) {
    return <div className="py-16 text-center text-sm text-white/70">কোন গেম পাওয়া যায়নি</div>;
  }
  return (
    <div className="mx-auto w-[1200px] max-w-[calc(100vw-96px)] rounded-xl border border-dashed border-[var(--neon-gold)]/40 bg-black/30 p-10 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--neon-gold)]/20 text-3xl">
        🎮
      </div>
      <h3 className="text-lg font-bold text-white">এখনো কোন নিজস্ব গেম নেই</h3>
      <p className="mt-2 text-sm text-white/70">
        এই জায়গাটি শুধুমাত্র আমাদের নিজের তৈরি অরিজিনাল গেমসের জন্য রাখা।
        <br />
        নতুন গেম তৈরি হলে এখানে যুক্ত হবে।
      </p>
    </div>
  );
}
