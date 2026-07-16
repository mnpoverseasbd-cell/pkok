import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Gamepad2, Sparkles, Heart } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import dicePoster from "@/assets/games/dice.jpg";
import crashPoster from "@/assets/games/crash.jpg";
import minesPoster from "@/assets/games/mines.jpg";
import coinflipPoster from "@/assets/games/coinflip.jpg";
import plinkoPoster from "@/assets/games/plinko.jpg";
import wheelPoster from "@/assets/games/wheel.jpg";

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

type OriginalGame = {
  slug: string;
  name: string;      // English name
  nameBn: string;    // Bengali label under card
  provider: string;  // JILI-style provider badge
  poster: string;
  status: "live" | "soon";
  to?: string;
};

const myGames: OriginalGame[] = [
  { slug: "dice",     name: "Lucky Dice",       nameBn: "লাকি ডাইস",       provider: "ASIK", poster: dicePoster,     status: "live", to: "/games/dice" },
  { slug: "crash",    name: "Crash",            nameBn: "ক্র্যাশ",          provider: "ASIK", poster: crashPoster,    status: "live", to: "/games/crash" },
  { slug: "mines",    name: "Mines",            nameBn: "মাইনস",           provider: "ASIK", poster: minesPoster,    status: "live", to: "/games/mines" },
  { slug: "coinflip", name: "Coin Flip",        nameBn: "কয়েন ফ্লিপ",       provider: "ASIK", poster: coinflipPoster, status: "live", to: "/games/coinflip" },
  { slug: "plinko",   name: "Plinko",           nameBn: "প্লিঙ্কো",         provider: "ASIK", poster: plinkoPoster,   status: "live", to: "/games/plinko" },
  { slug: "wheel",    name: "Wheel of Fortune", nameBn: "হুইল অফ ফরচুন",   provider: "ASIK", poster: wheelPoster,    status: "live", to: "/games/wheel" },
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
    <div className="game-card__inner">
      <div
        className={`relative aspect-[4/3] w-full bg-gradient-to-br ${g.gradient} flex items-center justify-center`}
      >
        {/* deep vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
        {/* floating emoji */}
        <span aria-hidden className="game-card__emoji relative z-[1] text-6xl drop-shadow-2xl">
          {g.emoji}
        </span>
        {/* sparkles */}
        <span className="game-card__spark" style={{ left: "12%", top: "18%", animationDelay: "0s" }} />
        <span className="game-card__spark" style={{ left: "82%", top: "24%", animationDelay: "0.9s" }} />
        <span className="game-card__spark" style={{ left: "22%", top: "72%", animationDelay: "1.6s" }} />
        <span className="game-card__spark" style={{ left: "76%", top: "68%", animationDelay: "2.2s" }} />
        {/* shine sweep */}
        <div className="game-card__shine" />
        {/* hover spotlight */}
        <div className="game-card__spot" />
      </div>

      {/* footer */}
      <div className="absolute inset-x-0 bottom-0 z-[3] bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 text-left">
        <div className="text-sm font-black tracking-wide text-white drop-shadow">{g.name}</div>
        <div className="text-[10px] font-medium text-white/80">{g.tagline}</div>
      </div>

      {/* LIVE / SOON badge */}
      <span
        className={`absolute left-2 top-2 z-[4] inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 backdrop-blur ${
          g.status === "live"
            ? "bg-red-600/95 text-white ring-white/50 shadow-[0_0_12px_rgba(255,60,60,0.7)]"
            : "bg-yellow-400/95 text-black ring-white/50"
        }`}
      >
        {g.status === "live" ? (
          <>
            <span className="gc-live-dot" />
            LIVE
          </>
        ) : (
          "SOON"
        )}
      </span>
    </div>
  );

  const className = "lobby-item game-card group animate-fade-in";
  const style = { animationDelay: `${Math.min(index * 40, 600)}ms`, animationFillMode: "backwards" as const };

  if (g.status === "live" && g.to) {
    return (
      <Link to={g.to as string} className={className} style={style} aria-label={g.name}>
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
