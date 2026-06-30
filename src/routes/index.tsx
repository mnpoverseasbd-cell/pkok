import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Apple,
  ChevronLeft,
  ChevronRight,
  Download,
  Flame,
  Gamepad2,
  Gift,
  Medal,
  QrCode,
  ShieldCheck,
  Smartphone,
  Trophy,
  Wallet,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { SiteShell } from "@/components/landing/SiteShell";
import phoneMockup from "@/assets/phone-mockup.png";
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


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Asik Game — Inspired Gaming Portal UI" },
      {
        name: "description",
        content:
          "Asik Game inspired gaming portal UI — বাংলা interface, game sections, provider strips, app download, promo area and responsive mobile-first layout.",
      },
      { property: "og:title", content: "Asik Game — Inspired Gaming Portal UI" },
      {
        property: "og:description",
        content: "বাংলা gaming portal style responsive frontend with slots, live, sports, fish, promo and app download sections.",
      },
    ],
  }),
  component: Index,
});

const topMenu = ["হোম", "গরম", "স্লট", "ফিশিং", "লাইভ", "স্পোর্টস", "ই-স্পোর্টস", "পোকার", "লটারি", "APP", "প্রমোশন"];

const providers = [
  "CQ9",
  "RG Rich",
  "Sexy",
  "Live Casino",
  "Lucky",
  "AP Gaming",
  "SABA",
  "TC Gaming",
  "PG",
  "Pragmatic",
  "Kingmidas",
  "2J",
  "Ezugi",
  "SA",
  "BTI",
  "Poly",
  "TF",
  "JILI",
  "JDB",
  "Microgaming",
  "R88",
  "SV",
  "VIA",
  "Dream Gaming",
  "FB Sports",
  "NextSpin",
  "FC",
  "BT",
  "MegaWin",
  "Evolution",
  "9Wickets",
  "United Gaming",
  "Spribe",
  "BNG",
];

const hotGames = [
  { title: "সুপার উইন", image: g1, provider: "PG", tag: "HOT" },
  { title: "জ্যাকপট ব্লাস্ট", image: g7, provider: "JILI", tag: "NEW" },
  { title: "অলিম্পাস", image: g12, provider: "Pragmatic" },
  { title: "মেগা রিচ", image: g11, provider: "JILI", tag: "HOT" },
  { title: "ক্র্যাশ এক্স", image: g3, provider: "SPRIBE" },
  { title: "মনি কইন", image: g9, provider: "JILI" },
];

const heroSlides = [
  {
    eyebrow: "অফিসিয়ালভাবে প্রত্যাবর্তিত • দারুণ অফার • নিরাপদ প্ল্যাটফর্ম",
    headline: "নতুনভাবে চালু হয়েছে",
    accent: "ASIKGAME.COM",
    sub: "জয়ের হার ৯৯% • ১০০% নিরাপত্তা নিশ্চিত",
  },
  {
    eyebrow: "৯৫০% স্বাগতম বোনাস • দৈনিক ফ্রি স্পিন",
    headline: "প্রথম ডিপোজিটেই পান",
    accent: "মেগা বোনাস ৯৫০%",
    sub: "নতুন প্লেয়ারদের জন্য এক্সক্লুসিভ অফার",
  },
  {
    eyebrow: "লাইভ ক্যাসিনো • ফিশিং • স্পোর্টস বেটিং",
    headline: "এক প্ল্যাটফর্মে",
    accent: "১০০০+ গেমস",
    sub: "PG • JILI • Pragmatic • Evolution • Spribe",
  },
];


const mainCategories = [
  { title: "স্লট", image: g7 },
  { title: "ফিশিং", image: g4 },
  { title: "লাইভ", image: g5 },
  { title: "পোকার", image: g9 },
];

const statCards = [
  { value: "30s", label: "গড় জমা হওয়ার সময়" },
  { value: "33", label: "পেমেন্ট চ্যানেল পার্টনার" },
  { value: "90s", label: "গড় উত্তোলনের সময়" },
  { value: "27", label: "গেম প্রোভাইডার পার্টনার" },
];

const featureCards = [
  {
    icon: Gift,
    title: "ফ্রি বোনাস ও প্রমোশন",
    body: "নতুন ব্যবহারকারীদের জন্য ওয়েলকাম অফার, ফ্রি স্পিন, দৈনিক রিওয়ার্ড এবং উৎসবের বিশেষ বোনাস।",
  },
  {
    icon: ShieldCheck,
    title: "নিরাপদ লেনদেন ও সম্পূর্ণ সুরক্ষা",
    body: "আধুনিক এনক্রিপশন ও নির্ভরযোগ্য পেমেন্ট চ্যানেল দিয়ে দ্রুত ও নিরাপদ জমা-উত্তোলন সুবিধা।",
  },
  {
    icon: Gamepad2,
    title: "রোমাঞ্চকর গেম সমাহার",
    body: "স্লট, লাইভ, স্পোর্টস, ফিশিং, RNG ও আরও অনেক ক্যাটাগরির জনপ্রিয় গেম এক জায়গায়।",
  },
  {
    icon: Wallet,
    title: "একাধিক ব্যাংকিং চ্যানেল",
    body: "bKash, Nagad, Rocket, Visa ও অন্যান্য জনপ্রিয় চ্যানেলে দ্রুত ট্রানজেকশন সাপোর্ট।",
  },
];

const promoCards = [
  { title: "৯৫০% স্বাগতম অফার", tone: "text-gradient-gold" },
  { title: "দৈনিক ফ্রি রিওয়ার্ড", tone: "text-gradient-green" },
  { title: "বিশেষ VIP ক্যাশব্যাক", tone: "text-gradient-gold" },
];

const leaderboard = [
  { name: "*****589", game: "সুপার উইন", amount: "৳168,450" },
  { name: "*****409", game: "লাকি স্পিন", amount: "৳150,000" },
  { name: "*****324", game: "ক্র্যাশ টাইম", amount: "৳100,200" },
  { name: "*****279", game: "মেগা রিচ", amount: "৳96,350" },
];

const listSections = [
  {
    id: "live-list",
    title: "লাইভ ক্যাসিনো",
    items: [g5, g6, g5, g1, g11, g5, g2, g7, g9, g5, g11, g6],
  },
  {
    id: "sports-list",
    title: "স্পোর্টস ও ই-স্পোর্টস",
    items: [g8, g10, g9, g8, g3, g2, g8, g12, g9, g10],
  },
  {
    id: "fish-list",
    title: "ফিশিং গেমস",
    items: [g4, g4, g4, g10, g4, g12, g4, g4, g11, g5, g12, g11],
  },
  {
    id: "rng-list",
    title: "RNG ও স্লট কালেকশন",
    items: [g1, g7, g12, g11, g3, g9, g1, g10, g11, g12, g7, g3, g9, g1, g11, g7, g2, g3, g4, g10, g11, g9, g12, g1],
  },
];



function Index() {
  return (
    <SiteShell>
      <HeroBanner />
      <TickerBar />
      <HotGamesSection />
      <JackpotSection />
      <MainCategoryCards />
      <AppSection />
      <ServiceStats />
      <FeatureList />
      <ProviderStrip />
      {listSections.map((section) => (
        <CategoryListSection key={section.id} section={section} />
      ))}
    </SiteShell>
  );
}

function HeroBanner() {
  const [idx, setIdx] = useState(0);
  const total = heroSlides.length;
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);
  const slide = heroSlides[idx];
  return (
    <section id="home" className="mx-auto max-w-7xl px-2 pt-2 sm:px-3 lg:px-4">
      <div className="relative overflow-hidden rounded-none border border-black/20 sm:rounded-md">
        <img src={heroBg} alt="Asik Game promotional banner" width={1920} height={900} className="h-[240px] w-full object-cover sm:h-[320px] lg:h-[420px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/35" />
        <div key={idx} className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center px-4 text-center">
          <div className="font-display text-4xl font-black sm:text-6xl lg:text-7xl">
            <span className="text-white">ASIK</span>
            <span className="text-gradient-gold"> OK</span>
          </div>
          <h1 className="mt-2 max-w-4xl text-2xl font-black text-white drop-shadow sm:text-4xl lg:text-5xl">
            {slide.headline} <span className="text-gradient-gold">{slide.accent}</span>
          </h1>
          <p className="mt-3 max-w-3xl rounded-full bg-[color-mix(in_oklab,var(--neon-pink)_35%,transparent)] px-4 py-2 text-sm font-bold text-white sm:text-lg">
            {slide.eyebrow}
          </p>
          <p className="mt-4 text-lg font-black text-white sm:text-3xl lg:text-4xl">
            {slide.sub}
          </p>
        </div>
        {/* Prev / Next */}
        <button
          aria-label="Previous slide"
          onClick={() => setIdx((i) => (i - 1 + total) % total)}
          className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-[var(--neon-green)]/60 sm:left-4 sm:h-11 sm:w-11"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          aria-label="Next slide"
          onClick={() => setIdx((i) => (i + 1) % total)}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-[var(--neon-green)]/60 sm:right-4 sm:h-11 sm:w-11"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-[var(--neon-gold)]" : "w-2 bg-white/50"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TickerBar() {
  return (
    <section className="mx-auto max-w-7xl px-2 pt-2 sm:px-3 lg:px-4">
      <div className="flex items-center gap-3 rounded-md bg-black/45 px-3 py-2 text-[11px] text-foreground/85">
        <span className="rounded-full bg-white/10 px-2 py-1">🔊</span>
        <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">
          <div className="animate-pulse-soft truncate">ASIK Game-এর নতুন অফিসিয়াল ভার্সনে স্বাগতম • বাংলা সাপোর্ট • প্রমোশন চলছে • নিরাপদ লেনদেন</div>
        </div>
        <span>🔔</span>
      </div>
    </section>
  );
}

function HotGamesSection() {
  return (
    <section className="mx-auto max-w-7xl px-3 py-5 sm:px-4 lg:px-6">
      <div className="rounded-2xl inset-panel p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-black text-[var(--neon-gold)]">
            <Flame className="h-4 w-4" /> গরম খেলা
          </div>
          <button className="rounded-full bg-green-button px-4 py-1 text-xs font-black text-[var(--background)]">আরও</button>
        </div>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3">
          <button className="grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white"><ChevronLeft className="h-4 w-4" /></button>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {hotGames.map((game) => (
              <div key={game.title} className="game-frame relative overflow-hidden rounded-xl p-1.5">
                {game.tag && (
                  <span className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[9px] font-black ${game.tag === "HOT" ? "bg-[var(--neon-pink)] text-white" : "bg-[var(--neon-gold)] text-[var(--background)]"}`}>
                    {game.tag}
                  </span>
                )}
                <span className="absolute right-2 top-2 z-10 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-bold text-[var(--neon-gold)]">
                  {game.provider}
                </span>
                <img src={game.image} alt={game.title} width={512} height={512} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" />
                <div className="pt-1.5 text-center text-[11px] font-semibold text-foreground/90 sm:text-xs">{game.title}</div>
              </div>
            ))}
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-full bg-[var(--neon-green)]/25 text-white"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </section>
  );
}


function JackpotSection() {
  return (
    <section className="mx-auto max-w-7xl px-3 pb-5 sm:px-4 lg:px-6">
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-black text-[var(--neon-gold)]"><Gift className="h-4 w-4" /> প্রমোশন</div>
          {promoCards.map((card) => (
            <div key={card.title} className="overflow-hidden rounded-xl border border-[var(--neon-green)]/45 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(0,0,0,0.25))] p-3">
              <div className={`text-lg font-black ${card.tone}`}>{card.title}</div>
              <div className="mt-1 text-xs text-foreground/80">আজই রেজিস্ট্রেশন করে এক্সক্লুসিভ বোনাস পান</div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--neon-green)]/45 panel-dark p-4 text-center">
          <div className="mx-auto mb-3 flex h-40 max-w-[440px] items-center justify-center rounded-[28px] bg-[radial-gradient(circle_at_center,rgba(255,214,54,0.3),transparent_52%),linear-gradient(180deg,rgba(22,80,54,0.45),rgba(7,22,16,0.8))]">
            <div>
              <div className="text-gradient-gold text-4xl font-black sm:text-5xl">JACKPOTS</div>
              <div className="mt-2 rounded-xl bg-black/60 px-6 py-2 text-3xl font-black text-[var(--neon-gold)] sm:text-5xl">438.097.079</div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--neon-gold)]"><Trophy className="h-4 w-4" /> সর্বশেষ বিজয়ী</div>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div key={entry.name} className="rounded-xl border border-[var(--neon-green)]/40 bg-black/35 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs text-foreground/80">{entry.name}</div>
                    <div className="truncate text-[11px] text-foreground/60">{entry.game}</div>
                  </div>
                  <div className="shrink-0 font-black text-[var(--neon-gold)]">{entry.amount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MainCategoryCards() {
  return (
    <section className="mx-auto max-w-7xl px-3 pb-8 sm:px-4 lg:px-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mainCategories.map((item) => (
          <div key={item.title} className="game-frame group overflow-hidden rounded-2xl p-2">
            <img src={item.image} alt={item.title} width={512} height={512} loading="lazy" className="aspect-[1.05/1] w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="py-2 text-center text-2xl font-black text-gradient-gold">{item.title}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AppSection() {
  return (
    <section className="mx-auto max-w-7xl px-3 pb-8 sm:px-4 lg:px-6">
      <div className="grid items-center gap-6 rounded-3xl border border-[var(--neon-green)]/45 panel-dark p-4 sm:p-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-2xl">
          <div className="absolute left-0 top-1/2 hidden -translate-y-1/2 sm:block">
            <div className="text-6xl">🐟</div>
          </div>
          <img src={phoneMockup} alt="Asik Game app preview" width={800} height={1024} className="relative z-10 w-44 animate-float sm:w-56 lg:w-64" />
        </div>
        <div>
          <div className="text-sm font-bold text-[var(--neon-green)]">সেরা অভিজ্ঞতা</div>
          <h2 className="mt-1 text-4xl font-black text-white sm:text-5xl">ASIK APP</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-foreground/80 sm:text-base">
            মোবাইল অ্যাপে পান ফাস্ট গেম লোডিং, বাংলা সাপোর্ট, বোনাস আপডেট, লাইভ নোটিফিকেশন এবং দ্রুত QR স্ক্যান ডাউনলোড সুবিধা।
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-green-button px-4 py-3 font-black text-[var(--background)]"><Download className="h-5 w-5" /> Android APP</button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-black/35 px-4 py-3 font-black text-white border border-border"><Apple className="h-5 w-5" /> IOS APP</button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:max-w-md">
            {["Android APP", "IOS APP"].map((label) => (
              <div key={label} className="rounded-2xl border border-[var(--neon-green)]/40 bg-black/35 p-3 text-center">
                <div className="mx-auto grid h-28 w-28 place-items-center rounded-lg bg-white text-[var(--background)] sm:h-32 sm:w-32">
                  <QrCode className="h-20 w-20" strokeWidth={1.5} />
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white"><Smartphone className="h-3.5 w-3.5" /> {label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceStats() {
  return (
    <section className="mx-auto max-w-7xl px-3 pb-6 sm:px-4 lg:px-6">
      <div className="rounded-[28px] border border-[var(--neon-green)]/45 panel-dark p-4">
        <div className="mx-auto mb-4 w-fit rounded-full bg-green-button px-10 py-2 text-lg font-black text-[var(--background)]">উত্তম মানের পরিষেবা</div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => (
            <div key={item.label} className="rounded-2xl border border-[var(--neon-green)]/35 bg-black/30 p-5 text-center">
              <div className="text-5xl font-black text-[var(--neon-gold)]">{item.value}</div>
              <div className="mt-2 text-sm text-foreground/80">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureList() {
  return (
    <section className="mx-auto max-w-7xl px-3 pb-8 sm:px-4 lg:px-6">
      <div className="space-y-4 rounded-[28px] border border-[var(--neon-green)]/45 panel-dark p-4 sm:p-5">
        {featureCards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-[var(--neon-green)]/35 bg-black/28 p-4">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-green-button text-[var(--background)]"><card.icon className="h-6 w-6" /></div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-[var(--neon-gold)]">{card.title}</h3>
                <p className="mt-1 text-sm leading-6 text-foreground/80">{card.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type Wordmark = {
  name: string;
  color: string;
  sub?: string;
  subColor?: string;
  glyph?: "circle" | "diamond" | "triangle" | "bolt" | "ring" | "square" | "star";
  font?: "sans" | "serif" | "display" | "mono";
  italic?: boolean;
};

const providerWordmarks: Wordmark[] = [
  { name: "CQ9", color: "#f5a524", sub: "GAMING", subColor: "#cbd5e1", glyph: "ring", font: "display" },
  { name: "RG", color: "#22d3ee", sub: "RICH GAME", subColor: "#67e8f9", glyph: "bolt", font: "sans" },
  { name: "Sexy", color: "#f472b6", glyph: "diamond", font: "display", italic: true },
  { name: "Live Casino", color: "#3b82f6", sub: "AI", subColor: "#60a5fa", glyph: "circle", font: "sans" },
  { name: "LUCKY", color: "#ef4444", glyph: "star", font: "display" },
  { name: "AP Gaming", color: "#0ea5e9", glyph: "triangle", font: "sans" },
  { name: "SABA", color: "#fde047", sub: "SPORTS", subColor: "#fef9c3", glyph: "square", font: "sans" },
  { name: "TC", color: "#a855f7", sub: "GAMING", subColor: "#e9d5ff", glyph: "ring", font: "sans" },
  { name: "PG", color: "#facc15", sub: "POCKET GAMES SOFT", subColor: "#fde68a", glyph: "diamond", font: "serif" },
  { name: "Pragmatic", color: "#dc2626", sub: "PLAY", subColor: "#fbbf24", glyph: "bolt", font: "display" },
  { name: "KINGMIDAS", color: "#fbbf24", glyph: "star", font: "serif" },
  { name: "2J.COM", color: "#fb923c", glyph: "square", font: "sans" },
  { name: "Ezugi", color: "#fde047", sub: "SMART MOVE", subColor: "#fef9c3", glyph: "triangle", font: "display", italic: true },
  { name: "SA", color: "#fbbf24", sub: "GAMING", subColor: "#fde68a", glyph: "ring", font: "serif" },
  { name: "BTi", color: "#ef4444", glyph: "circle", font: "sans" },
  { name: "POLY", color: "#a855f7", sub: "SPORTS", subColor: "#e9d5ff", glyph: "triangle", font: "sans" },
  { name: "TF GAMING", color: "#22d3ee", glyph: "bolt", font: "sans" },
  { name: "JILI", color: "#fbbf24", glyph: "diamond", font: "display" },
  { name: "JDB", color: "#facc15", glyph: "square", font: "display" },
  { name: "Microgaming", color: "#10b981", glyph: "ring", font: "sans" },
  { name: "R88", color: "#ec4899", sub: "RICH 88", subColor: "#f9a8d4", glyph: "star", font: "display" },
  { name: "SV", color: "#fbbf24", sub: "SW GAMING", subColor: "#fde68a", glyph: "bolt", font: "sans" },
  { name: "VIA", color: "#ec4899", glyph: "diamond", font: "display", italic: true },
  { name: "Dream Gaming", color: "#cbd5e1", glyph: "ring", font: "serif" },
  { name: "FB", color: "#facc15", sub: "SPORTS", subColor: "#fde68a", glyph: "bolt", font: "sans" },
  { name: "SV", color: "#fbbf24", sub: "388", subColor: "#fef3c7", glyph: "square", font: "display" },
  { name: "IA", color: "#ef4444", sub: "E-SPORTS", subColor: "#fca5a5", glyph: "triangle", font: "sans" },
  { name: "NEXTSPIN", color: "#cbd5e1", glyph: "circle", font: "sans" },
  { name: "FC", color: "#ef4444", sub: "FA CHAI", subColor: "#fca5a5", glyph: "square", font: "display" },
  { name: "BT", color: "#facc15", sub: "GAMING", subColor: "#fde68a", glyph: "bolt", font: "sans" },
  { name: "MEGAWIN", color: "#fbbf24", glyph: "star", font: "serif" },
  { name: "Evolution", color: "#ef4444", glyph: "ring", font: "sans", italic: true },
  { name: "9 Wickets", color: "#22c55e", glyph: "circle", font: "display" },
  { name: "UNITED", color: "#06b6d4", sub: "GAMING", subColor: "#67e8f9", glyph: "ring", font: "sans" },
  { name: "SPRIBE", color: "#f1f5f9", glyph: "triangle", font: "sans" },
  { name: "BNG", color: "#10b981", glyph: "circle", font: "sans" },
];

const fontClass: Record<NonNullable<Wordmark["font"]>, string> = {
  sans: "font-sans",
  serif: "font-serif",
  display: "font-display",
  mono: "font-mono",
};

function Glyph({ shape, color }: { shape: NonNullable<Wordmark["glyph"]>; color: string }) {
  const common = "h-4 w-4 shrink-0";
  switch (shape) {
    case "circle":
      return <svg viewBox="0 0 16 16" className={common}><circle cx="8" cy="8" r="6" fill={color} /></svg>;
    case "ring":
      return <svg viewBox="0 0 16 16" className={common}><circle cx="8" cy="8" r="6" stroke={color} strokeWidth="2" fill="none" /></svg>;
    case "diamond":
      return <svg viewBox="0 0 16 16" className={common}><rect x="3.5" y="3.5" width="9" height="9" transform="rotate(45 8 8)" fill={color} /></svg>;
    case "triangle":
      return <svg viewBox="0 0 16 16" className={common}><polygon points="8,2 14,14 2,14" fill={color} /></svg>;
    case "bolt":
      return <svg viewBox="0 0 16 16" className={common}><polygon points="9,1 3,9 7,9 5,15 13,7 9,7" fill={color} /></svg>;
    case "square":
      return <svg viewBox="0 0 16 16" className={common}><rect x="2.5" y="2.5" width="11" height="11" fill={color} /></svg>;
    case "star":
      return <svg viewBox="0 0 16 16" className={common}><polygon points="8,1 10,6 15,6 11,10 12,15 8,12 4,15 5,10 1,6 6,6" fill={color} /></svg>;
  }
}

function ProviderStrip() {
  return (
    <section className="bg-black py-10">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mb-6 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-foreground/55">
          আমাদের গেম প্রোভাইডার
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-5 lg:grid-cols-10">
          {providerWordmarks.map((w, i) => (
            <div
              key={`${w.name}-${i}`}
              className="group flex h-14 items-center justify-center gap-2 transition hover:scale-105"
              title={w.name}
            >
              {w.glyph && <Glyph shape={w.glyph} color={w.color} />}
              <div className="flex min-w-0 flex-col leading-none">
                <span
                  className={`truncate text-[13px] font-black uppercase tracking-tight sm:text-sm ${fontClass[w.font ?? "sans"]} ${w.italic ? "italic" : ""}`}
                  style={{ color: w.color, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
                >
                  {w.name}
                </span>
                {w.sub && (
                  <span
                    className="mt-0.5 truncate text-[8px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: w.subColor ?? "#94a3b8" }}
                  >
                    {w.sub}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Promo paragraph + license badges */}
        <div className="mt-10 grid gap-6 border-t border-white/10 pt-8 lg:grid-cols-[1.6fr_1fr_1fr]">
          <p className="max-w-2xl text-sm leading-7 text-foreground/75">
            স্লট গেমস সবসময়ই Asik Game-এর সবচেয়ে জনপ্রিয় ক্যাটাগরির একটি। সেরা প্রোভাইডার নির্বাচন করে আমরা প্লেয়ারদের জন্য নিয়ে এসেছি বৈচিত্র্যময় থিম, চমৎকার গ্রাফিক্স এবং উদ্ভাবনী ফিচার সম্পন্ন গেম। প্রাচীন সভ্যতা থেকে শুরু করে ভবিষ্যৎ জগৎ, ক্লাসিক ফলের স্লট থেকে গল্পনির্ভর অ্যাডভেঞ্চার — সব ধরনের পছন্দের জন্য কিছু না কিছু রয়েছে।
          </p>
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[var(--neon-pink)]/20 text-2xl font-black text-[var(--neon-pink)]">⚑</div>
            <div>
              <div className="text-base font-black uppercase text-white">Malta Gaming Authority</div>
              <div className="text-xs text-foreground/70">Maltese license (MGA) certification</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-500/20 text-xl font-black text-blue-300">★</div>
            <div>
              <div className="text-base font-black uppercase text-white">British Virgin Islands</div>
              <div className="text-xs text-foreground/70">BVI Financial Services Commission</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function CategoryListSection({ section }: { section: { id: string; title: string; items: string[] } }) {
  return (
    <section id={section.id} className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
      <div className="mb-4 flex items-center gap-2 text-lg font-black text-[var(--neon-gold)]"><Medal className="h-5 w-5" /> {section.title}</div>
      <div className={`grid gap-3 ${section.id === "rng-list" ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"}`}>
        {section.items.map((img, index) => (
          <div key={`${section.id}-${index}`} className="game-frame overflow-hidden rounded-2xl p-1.5">
            <img src={img} alt={`${section.title} card ${index + 1}`} width={512} height={512} loading="lazy" className="aspect-[0.82/1] w-full rounded-xl object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}

