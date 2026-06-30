import { createFileRoute } from "@tanstack/react-router";
import { Heart, Flame } from "lucide-react";
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
  { name: "ফরচুন র‍্যাবিট", provider: "PG", img: `${FALLBACK}/PG/EN/PG0083.avif` },
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

function HotPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-2 pt-3 sm:px-4">
        {/* Header card */}
        <div className="rounded-t-lg bg-[linear-gradient(180deg,rgba(7,40,28,0.85),rgba(4,18,12,0.95))] px-4 py-3 ring-1 ring-[var(--neon-green)]/30">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <h1 className="text-base font-bold text-[var(--neon-gold)] sm:text-lg">গরম খেলা</h1>
          </div>
        </div>

        {/* Game grid */}
        <div className="rounded-b-lg bg-neutral-200/95 p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
            {hotGames.map((g, i) => (
              <GameCard key={i} game={g} />
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function GameCard({ game }: { game: Game }) {
  return (
    <div className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-black ring-1 ring-black/10 transition hover:scale-[1.02] hover:ring-[var(--neon-gold)]">
        {/* Provider tag */}
        <span className="absolute left-1.5 top-1.5 z-10 rounded bg-[linear-gradient(180deg,#1a8a4a,#0a4a23)] px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-[var(--neon-green)]/60">
          {game.provider}
        </span>
        {/* Heart */}
        <button
          aria-label="favorite"
          className="absolute right-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-black/40 text-white/70 backdrop-blur hover:bg-black/60 hover:text-[var(--neon-gold)]"
        >
          <Heart className="h-3.5 w-3.5" />
        </button>
        <img
          src={game.img}
          alt={game.name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = `${FALLBACK}/JL/EN/JL0036.avif`;
          }}
        />
      </div>
      <p className="mt-1.5 truncate px-1 text-center text-xs font-medium text-black sm:text-sm">
        {game.name}
      </p>
    </div>
  );
}
