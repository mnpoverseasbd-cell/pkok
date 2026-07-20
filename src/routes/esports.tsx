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
import limboPoster from "@/assets/games/limbo.jpg";
import imgAviator from "@/assets/game-aviator.jpg";
import imgPharaoh from "@/assets/game-pharaoh.jpg";
import imgPoker from "@/assets/game-poker.jpg";
import imgBaccarat from "@/assets/game-baccarat.jpg";
import imgCandy from "@/assets/game-candy.jpg";
import imgSlot1 from "@/assets/game-slot1.jpg";
import imgRoulette from "@/assets/game-roulette.jpg";
import imgFortune from "@/assets/game-fortune.jpg";

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
  { slug: "dice",             name: "Lucky Dice",        nameBn: "লাকি ডাইস",         provider: "ASIK", poster: dicePoster,     status: "live", to: "/games/dice" },
  { slug: "crash",            name: "Crash",             nameBn: "ক্র্যাশ",            provider: "ASIK", poster: crashPoster,    status: "live", to: "/games/crash" },
  { slug: "mines",            name: "Mines",             nameBn: "মাইনস",             provider: "ASIK", poster: minesPoster,    status: "live", to: "/games/mines" },
  { slug: "coinflip",         name: "Coin Flip",         nameBn: "কয়েন ফ্লিপ",         provider: "ASIK", poster: coinflipPoster, status: "live", to: "/games/coinflip" },
  { slug: "plinko",           name: "Plinko",            nameBn: "প্লিঙ্কো",           provider: "ASIK", poster: plinkoPoster,   status: "live", to: "/games/plinko" },
  { slug: "wheel",            name: "Wheel of Fortune",  nameBn: "হুইল অফ ফরচুন",     provider: "ASIK", poster: wheelPoster,    status: "live", to: "/games/wheel" },
  { slug: "limbo",            name: "Limbo",             nameBn: "লিম্বো",             provider: "ASIK", poster: limboPoster,    status: "live", to: "/games/limbo" },
  { slug: "chicken-road",     name: "Chicken Road",      nameBn: "চিকেন রোড",         provider: "ASIK", poster: imgAviator,     status: "live", to: "/games/chicken-road" },
  { slug: "tower",            name: "Tower — Royal Step",nameBn: "টাওয়ার",            provider: "ASIK", poster: imgPharaoh,     status: "live", to: "/games/tower" },
  { slug: "lucky-card",       name: "Lucky Card",        nameBn: "লাকি কার্ড",         provider: "ASIK", poster: imgPoker,       status: "live", to: "/games/lucky-card" },
  { slug: "shell-game",       name: "Shell Game",        nameBn: "শেল গেম",           provider: "ASIK", poster: imgBaccarat,    status: "live", to: "/games/shell-game" },
  { slug: "scratch-card",     name: "Scratch Card",      nameBn: "স্ক্র্যাচ কার্ড",     provider: "ASIK", poster: imgCandy,       status: "live", to: "/games/scratch-card" },
  { slug: "keno",             name: "Keno",              nameBn: "কেনো",              provider: "ASIK", poster: imgSlot1,       status: "live", to: "/games/keno" },
  { slug: "hi-lo",            name: "Hi-Lo",             nameBn: "হাই-লো",            provider: "ASIK", poster: imgPoker,       status: "live", to: "/games/hi-lo" },
  { slug: "color-prediction", name: "Color Prediction",  nameBn: "কালার প্রেডিকশন",   provider: "ASIK", poster: imgRoulette,    status: "live", to: "/games/color-prediction" },
  { slug: "andar-bahar",      name: "Andar Bahar",       nameBn: "আন্দর বাহার",       provider: "ASIK", poster: imgBaccarat,    status: "live", to: "/games/andar-bahar" },
  { slug: "dragon-tiger",     name: "Dragon Tiger",      nameBn: "ড্রাগন টাইগার",     provider: "ASIK", poster: imgPoker,       status: "live", to: "/games/dragon-tiger" },
  { slug: "teen-patti",       name: "Teen Patti",        nameBn: "তিন পাত্তি",         provider: "ASIK", poster: imgPoker,       status: "live", to: "/games/teen-patti" },
  { slug: "seven-up-down",    name: "7 Up 7 Down",       nameBn: "৭ আপ ৭ ডাউন",       provider: "ASIK", poster: dicePoster,     status: "live", to: "/games/seven-up-down" },
  { slug: "baccarat",         name: "Baccarat",          nameBn: "ব্যাকারা",           provider: "ASIK", poster: imgBaccarat,    status: "live", to: "/games/baccarat" },
  { slug: "sic-bo",           name: "Sic Bo",            nameBn: "সিক বো",            provider: "ASIK", poster: dicePoster,     status: "live", to: "/games/sic-bo" },
  { slug: "roulette",         name: "Roulette",          nameBn: "রুলেট",             provider: "ASIK", poster: imgRoulette,    status: "live", to: "/games/roulette" },
  { slug: "blackjack",        name: "Blackjack",         nameBn: "ব্ল্যাকজ্যাক",         provider: "ASIK", poster: imgPoker,       status: "live", to: "/games/blackjack" },
  { slug: "32-cards",         name: "32 Cards",          nameBn: "৩২ কার্ড",           provider: "ASIK", poster: imgBaccarat,    status: "live", to: "/games/32-cards" },
  { slug: "video-poker",      name: "Video Poker",       nameBn: "ভিডিও পোকার",       provider: "ASIK", poster: imgPoker,       status: "live", to: "/games/video-poker" },
  { slug: "slots",            name: "Cosmic Fortune Slots", nameBn: "কসমিক ফরচুন স্লটস", provider: "ASIK", poster: imgSlot1,      status: "live", to: "/games/slots" },
  { slug: "bingo",            name: "Bingo 75",          nameBn: "বিঙ্গো ৭৫",           provider: "ASIK", poster: imgCandy,       status: "live", to: "/games/bingo" },
  { slug: "matka",            name: "Matka King",        nameBn: "মটকা কিং",          provider: "ASIK", poster: imgCandy,       status: "live", to: "/games/matka" },
  { slug: "fish-shooter",     name: "Fish Shooter",      nameBn: "ফিশ শুটার",         provider: "ASIK", poster: imgAviator,     status: "live", to: "/games/fish-shooter" },
  { slug: "megaways",         name: "Fruit Slots Megaways", nameBn: "ফ্রুট স্লট মেগাওয়েজ", provider: "ASIK", poster: imgCandy,    status: "live", to: "/games/megaways" },
  { slug: "aviatrix",         name: "Aviatrix Multi-Race", nameBn: "অ্যাভিয়াট্রিক্স রেস", provider: "ASIK", poster: imgAviator,   status: "live", to: "/games/aviatrix" },
  { slug: "dragon-fishing",   name: "Dragon Fortune Fishing", nameBn: "ড্রাগন ফরচুন ফিশিং", provider: "ASIK", poster: imgAviator, status: "live", to: "/games/dragon-fishing" },
  { slug: "penalty",          name: "Penalty Shootout",  nameBn: "পেনাল্টি শুটআউট",   provider: "ASIK", poster: imgFortune,     status: "live", to: "/games/penalty" },
  { slug: "cricket",          name: "Cricket Star",      nameBn: "ক্রিকেট স্টার",     provider: "ASIK", poster: imgAviator,     status: "live", to: "/games/cricket" },
  { slug: "ludo",             name: "Ludo Dash",         nameBn: "লুডু ড্যাশ",         provider: "ASIK", poster: imgAviator,     status: "live", to: "/games/ludo" },


];

function MyGamesPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return myGames;
    return myGames.filter(
      (g) => g.name.toLowerCase().includes(q) || g.nameBn.includes(q) || g.slug.includes(q),
    );
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
          <div className="mygames-grid">
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
    <>
      <div className="mygames-tile group">
        <img
          src={g.poster}
          alt={g.name}
          loading="lazy"
          width={640}
          height={640}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />

        {/* Provider badge (top-left) */}
        <span className="absolute left-1.5 top-1.5 z-[3] rounded-sm bg-gradient-to-b from-emerald-500 to-emerald-800 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-white shadow ring-1 ring-black/40">
          {g.provider}
        </span>

        {/* Heart (top-right) */}
        <span className="absolute right-1.5 top-1.5 z-[3] grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white/85 ring-1 ring-white/25 backdrop-blur">
          <Heart className="h-3.5 w-3.5" />
        </span>

        {/* LIVE / SOON */}
        <span
          className={`absolute bottom-1.5 left-1.5 z-[3] inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 backdrop-blur ${
            g.status === "live"
              ? "bg-red-600/95 text-white ring-white/50 shadow-[0_0_10px_rgba(255,60,60,0.7)]"
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

      {/* Bengali label BELOW the tile */}
      <div className="mt-2 text-center text-[14px] font-semibold text-white/95 drop-shadow">
        {g.nameBn}
      </div>
    </>
  );

  const className = "mygames-item animate-fade-in";
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
