import { createFileRoute } from "@tanstack/react-router";
import { Heart, Flame, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteShell } from "@/components/landing/SiteShell";

export const Route = createFileRoute("/hot")({
  head: () => ({
    meta: [
      { title: "গরম খেলা — Asik Game" },
      { name: "description", content: "সর্বাধিক জনপ্রিয় ও গরম গেমস — JILI, PG, JDB, BNG সহ শীর্ষ প্রোভাইডারের সেরা গেম এক জায়গায়।" },
      { property: "og:title", content: "গরম খেলা — Asik Game" },
      { property: "og:description", content: "এখনই খেলুন আজকের সবচেয়ে জনপ্রিয় হট গেমগুলো।" },
    ],
  }),
  component: HotPage,
});

const CDN = "https://images.23924894.com/prod-images/TCG_GAME_ICONS/HOT_GAME/pkokbdtf6/pc";
const FALLBACK = "https://images.23924894.com/TCG_GAME_ICONS";

type Game = { name: string; provider: string; img: string };

const hotGames: Game[] = [
  { name: "বন্য ব্যান্ডিটো", provider: "PG", img: `${FALLBACK}/PG/EN/PG0066.avif` },
  { name: "৭৭৭-ক্লাসিক স্টাইল", provider: "JILI", img: `${CDN}/JL/BN/JL0033.png?_1781943712730` },
  { name: "সুপার এস জোকার", provider: "JILI", img: `${CDN}/JL/BN/JL0125.webp?_1781944103405` },
  { name: "পাগল টাকা ২", provider: "JILI", img: `${CDN}/JL/BN/JL0038.webp?_1781944315751` },
  { name: "৩ কয়েন আগ্নেয়গিরি", provider: "JILI", img: `${CDN}/JL/BN/JL0045.png?_1781944679386` },
  { name: "গোল্ডেন এম্পায়ার", provider: "JILI", img: `${FALLBACK}/JL/EN/JL0036.avif` },
  { name: "কয়েন ট্রি", provider: "JILI", img: `${FALLBACK}/JL/EN/JL0211.avif` },
  { name: "জিলি ক্যাশকেশন", provider: "JILI", img: `${CDN}/JL/BN/JL0156.webp?_1781946026517` },
  { name: "ফরচুন কিং জ্যাকপট", provider: "JILI", img: `${CDN}/JL/BN/JL0162.webp?_1781946086115` },
  { name: "১০ ঝনঝনে মুক্ত", provider: "JILI", img: `${FALLBACK}/JL/EN/JL0021.avif` },
  { name: "আনুবিস", provider: "PG", img: `${CDN}/PG/BN/PG0113.png?_1781944523930` },
  { name: "ফরচুন র\u200cযাবিট", provider: "PG", img: `${FALLBACK}/PG/EN/PG0083.avif` },
  { name: "সুপার এস কুয়াচ", provider: "JILI", img: `${FALLBACK}/JL/EN/JL0189.avif` },
  { name: "আলি বাবা", provider: "JILI", img: `${FALLBACK}/JL/EN/JL0044.avif` },
  { name: "মানি পট", provider: "JILI", img: `${FALLBACK}/JL/EN/JL0202.avif` },
  { name: "৩টি তেড়ে যাওয়া মহিষ", provider: "JILI", img: `${FALLBACK}/JL/EN/JL0083.avif` },
  { name: "লিগেসি অফ ইজিপ্ট", provider: "JILI", img: `${FALLBACK}/JL/EN/JL0183.avif` },
  { name: "মাইনস", provider: "JILI", img: `${FALLBACK}/JL/EN/JL0217.avif` },
  { name: "গোল্ডেন ফ্ল্যাশ", provider: "FC", img: `${CDN}/FC/BN/FC0045.png?_1781944995783` },
  { name: "ড্রাগন ফরচুন", provider: "JDB", img: `${CDN}/JDB/BN/JDB225.webp?_1781945326027` },
  { name: "মেগা উইন", provider: "EG4", img: `${FALLBACK}/EG4/EN/EG4147.png?t=1782816272075` },
  { name: "লাকি ফেনিক্স", provider: "EG4", img: `${FALLBACK}/EG4/EN/EG4326.png?t=1782815902264` },
  { name: "নাইন উইন্ড", provider: "U9W", img: `${CDN}/U9W/BN/U9W004.webp?_1776688307038` },
  { name: "সুপার বনাঞ্জা", provider: "BNG", img: `${FALLBACK}/BNG/EN/BNG084.avif` },
  { name: "ফ্রুট পার্টি", provider: "BNG", img: `${FALLBACK}/BNG/EN/BNG074.avif` },
  { name: "ম্যাজিক জার", provider: "BNG", img: `${FALLBACK}/BNG/EN/BNG107.avif` },
  { name: "কুইন অব নাইট", provider: "JL", img: `${FALLBACK}/JL/EN/JL0214.avif` },
  { name: "ফরচুন ড্রাগন", provider: "MG", img: `${FALLBACK}/MG/EN/MG0416.avif` },
  { name: "ড্রাগন রিল", provider: "JDB", img: `${FALLBACK}/JDB/EN/JDB189.avif` },
  { name: "ক্যাশ ব্লাস্ট", provider: "BT", img: `${FALLBACK}/BT/EN/BT0085.avif` },
  { name: "মেগা মানি", provider: "JL", img: `${FALLBACK}/JL/EN/JL0212.avif` },
  { name: "সিক্রেট ভল্ট", provider: "JL", img: `${FALLBACK}/JL/EN/JL0215.avif` },
  { name: "ক্যান্ডি বুম", provider: "JL", img: `${FALLBACK}/JL/EN/JL0083.avif` },
  { name: "মিস্টিক রিচেস", provider: "PG", img: `${FALLBACK}/PG/EN/PG0146.avif` },
  { name: "ড্রাগন কিং", provider: "JL", img: `${FALLBACK}/JL/EN/JL0215.avif` },
  { name: "ফেস্টিভাল উইন", provider: "JL", img: `${FALLBACK}/JL/EN/JL0202.avif` },
];

const providers = ["সব", "JILI", "PG", "JDB", "BNG", "EG4", "FC", "MG", "BT", "PP", "U9W", "JL"];

function HotPage() {
  const [active, setActive] = useState("সব");
  const [query, setQuery] = useState("");
  const [favs, setFavs] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    return hotGames.filter((g) => {
      const p = active === "সব" || g.provider === active || (active === "JILI" && g.provider === "JL");
      const q = query.trim() === "" || g.name.includes(query.trim());
      return p && q;
    });
  }, [active, query]);

  const toggleFav = (i: number) => {
    setFavs((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pt-4 sm:px-4 lg:px-6">
        <div className="rounded-2xl bg-[#e6e2d6] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:p-4">
          {/* Header row: pill + search */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(180deg,#0f5a34,#083f22)] px-4 py-2 ring-1 ring-[var(--neon-green)]/50">
              <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
              <h1 className="text-base font-bold tracking-wide text-[var(--neon-gold)]">গরম খেলা</h1>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 ring-1 ring-black/10">
              <Search className="h-4 w-4 text-black/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="গেম খুঁজুন..."
                className="w-40 border-none bg-transparent text-sm text-black placeholder:text-black/40 focus:outline-none sm:w-56"
              />
            </div>
          </div>

          {/* Provider filter chips */}
          <div className="mb-3 -mx-1 overflow-x-auto">
            <div className="flex w-max gap-2 px-1">
              {providers.map((p) => {
                const isActive = active === p;
                return (
                  <button
                    key={p}
                    onClick={() => setActive(p)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
                      isActive
                        ? "bg-[linear-gradient(180deg,#12a651,#0a7a37)] text-white shadow-[0_4px_12px_rgba(18,166,81,0.4)] scale-105"
                        : "bg-white/70 text-[#2b2b2b] hover:bg-white"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Game grid */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-black/60">কোন গেম পাওয়া যায়নি</div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
              {filtered.map((g, i) => (
                <GameCard
                  key={`${g.name}-${i}`}
                  game={g}
                  index={i}
                  fav={favs.has(i)}
                  onFav={() => toggleFav(i)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function GameCard({
  game,
  index,
  fav,
  onFav,
}: {
  game: Game;
  index: number;
  fav: boolean;
  onFav: () => void;
}) {
  return (
    <div
      className="group flex flex-col animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 30, 600)}ms`, animationFillMode: "backwards" }}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-black ring-1 ring-black/40 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:ring-2 hover:ring-[var(--neon-gold)] hover:shadow-[0_10px_28px_rgba(255,215,80,0.35)]">
        {/* Provider pill */}
        <div className="absolute inset-x-2 top-2 z-10 flex items-center justify-between rounded-md bg-[linear-gradient(180deg,#1a8a4a,#0a4a23)] px-2 py-1 ring-1 ring-[var(--neon-green)]/60">
          <span className="text-[11px] font-black tracking-wider text-white drop-shadow">
            {game.provider}
          </span>
          <button
            aria-label="favorite"
            onClick={(e) => {
              e.preventDefault();
              onFav();
            }}
            className={`grid h-4 w-4 place-items-center rounded-full transition ${
              fav ? "bg-[var(--neon-pink)]/90 text-white" : "bg-black/40 text-white/80 hover:text-[var(--neon-gold)]"
            }`}
          >
            <Heart className={`h-3 w-3 ${fav ? "fill-white" : ""}`} />
          </button>
        </div>

        <img
          src={game.img}
          alt={game.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = `${FALLBACK}/JL/EN/JL0036.avif`;
          }}
        />

        {/* Play overlay on hover */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="mb-3 rounded-full bg-[var(--neon-gold)] px-4 py-1 text-xs font-black text-black shadow-lg">
            খেলুন
          </span>
        </div>
      </div>
      <p className="mt-2 truncate px-0.5 text-center text-[13px] font-semibold text-[#2b2b2b]">
        {game.name}
      </p>
    </div>
  );
}
