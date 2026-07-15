import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Apple,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  Flame,
  Gamepad2,
  Gift,
  Medal,
  Megaphone,
  QrCode,
  ShieldCheck,
  Smartphone,
  Trophy,
  Wallet,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";
import { SiteShell } from "@/components/landing/SiteShell";
import { useLang } from "@/components/landing/LanguageContext";
import phoneMockup from "@/assets/phone-mockup.png";
import mascotAppScene from "@/assets/mascots/app-scene.png";
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
import mascotSlots from "@/assets/mascot-slots.png";
import mascotFish from "@/assets/mascot-fish.png";
import mascotLive from "@/assets/mascot-live.png";
import mascotPoker from "@/assets/mascot-poker.png";
import categoryReference from "@/assets/reference/category-reference.png.asset.json";
import promoWelcome from "@/assets/promo-welcome.jpg";
import promoDaily from "@/assets/promo-daily.jpg";
import promoVip from "@/assets/promo-vip.jpg";
import jackpotHero from "@/assets/jackpot-hero.png";
import iconStopwatch from "@/assets/icon-stopwatch.png";
import iconSecure from "@/assets/icon-secure.png";
import iconGamepad from "@/assets/icon-gamepad.png";
import iconDevices from "@/assets/icon-devices.png";



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
        content: "Asik Game inspired gaming portal UI — বাংলা interface, game sections, provider strips, app download, promo area and responsive mobile-first layout.",
      },
    ],
  }),
  component: Index,
});

const topMenu = ["হোম", "গরম", "স্লট", "ফিশিং", "লাইভ", "স্পোর্টস", "ই-স্পোর্টস", "পোকার", "লটারি", "APP", "প্রমোশন"];




const hotGames = [
  { title: "Money Coming", image: g1, provider: "JILI" },
  { title: "Fortune Coins", image: g7, provider: "JL", tag: "HOT" },
  { title: "Wild Bounty Showdown", image: g12, provider: "PG" },
  { title: "Super Elements", image: g11, provider: "FC", tag: "NEW" },
  { title: "Magic Ace WILD LOCK", image: g3, provider: "JDB" },
  { title: "Crazy Time", image: g2, provider: "Evolution", tag: "HOT" },
  { title: "Fortune Gems 3", image: g9, provider: "JILI" },
  { title: "Mega Ace", image: g6, provider: "JILI" },
  { title: "Super Win", image: g1, provider: "PG", tag: "HOT" },
  { title: "Lightning Roulette", image: g2, provider: "Evolution" },
  { title: "Aviator", image: g8, provider: "SPRIBE", tag: "HOT" },
  { title: "Dragon Tiger", image: g6, provider: "PP" },
  { title: "Candy Bonanza", image: g11, provider: "PG" },
  { title: "Pharaoh's Gold", image: g12, provider: "JILI" },
];


const heroSlides = [
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1782010244895_default_web.gif", alt: "PKOK ওয়েলকাম অফার" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1749471959813_%E6%9C%80%E6%96%B0%E9%82%80%E8%AF%B7-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "রেফার বোনাস" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747143550330_%E7%A0%B8%E9%87%91%E8%9B%8B-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "গোল্ডেন এগ" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747312234220_%E6%96%B0%E6%AF%8F%E6%97%A5%E9%94%A6%E6%A0%87%E8%B5%9B%E6%8C%91%E6%88%98-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "দৈনিক টুর্নামেন্ট" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747144765012_vip-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "VIP প্রোগ্রাম" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747300681369_%E6%96%B0%E9%A6%96%E6%AC%A1%E5%AD%98%E6%AC%BE-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "প্রথম ডিপোজিট" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747377336517_%E6%96%B0%E7%AC%AC%E4%BA%8C%E6%AC%A1%E5%AD%98%E6%AC%BE-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "দ্বিতীয় ডিপোজিট" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747278434187_%E6%96%B0%E5%B9%B8%E8%BF%90%E7%BA%A2%E5%8C%85%E9%9B%A8-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "রেড প্যাকেট রেইন" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747364377090_%E6%96%B0%E8%80%81%E8%99%8E%E6%9C%BA%E6%B8%B8%E6%88%8F-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "স্লট গেমস" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747312902970_%E6%9C%80%E6%96%B0%E4%BC%9A%E5%91%98%E6%88%90%E9%95%BF%E8%AE%A1%E5%88%92-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "মেম্বার গ্রোথ" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747279191605_%E7%A5%9E%E7%A7%98%E5%A5%96%E9%87%91%E5%92%8C%E5%B9%B8%E8%BF%90%E5%A5%96%E9%87%91-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "মিস্টারি বোনাস" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747314159267_%E6%96%B0%E4%BC%9A%E5%91%98%E6%97%A5%E5%A5%96%E9%87%91-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "দৈনিক বোনাস" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747364056237_%E6%9C%80%E6%96%B0%E5%AE%9E%E6%97%B6%E6%8A%95%E6%B3%A8-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "লাইভ বেটিং" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747224876449_%E4%B8%8B%E8%BD%BDAPP-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "অ্যাপ ডাউনলোড" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747224231880_%E6%B3%A8%E5%86%8C%E9%80%81-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "রেজিস্টার বোনাস" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747025275760_%E7%94%9F%E6%97%A5-%E8%BD%AE%E5%8D%9A.jpeg", alt: "জন্মদিন বোনাস" },
  { image: "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1747198737427_%E5%85%B3%E6%B3%A8TG%E5%AE%98%E6%96%B9%E9%A2%91%E9%81%93-%E8%BD%AE%E5%8D%9A%20%E7%BD%91%E9%A1%B5.jpeg", alt: "Telegram চ্যানেল" },
];



const mainCategories = [
  { key: "catSlots" as const, mascot: mascotSlots },
  { key: "catFish" as const, mascot: mascotFish },
  { key: "catLive" as const, mascot: mascotLive },
  { key: "catPoker" as const, mascot: mascotPoker },
];

const statCards = [
  { value: "30", unit: "s", labelKey: "statAvgDeposit" as const },
  { value: "33", unit: "", labelKey: "statPaymentPartners" as const },
  { value: "90", unit: "s", labelKey: "statAvgWithdraw" as const },
  { value: "27", unit: "", labelKey: "statGameProviders" as const },
];

const featureCards = [
  { icon: iconStopwatch, titleKey: "featFastTitle" as const, bodyKey: "featFastBody" as const },
  { icon: iconSecure, titleKey: "featSecureTitle" as const, bodyKey: "featSecureBody" as const },
  { icon: iconGamepad, titleKey: "featGamesTitle" as const, bodyKey: "featGamesBody" as const },
  { icon: iconDevices, titleKey: "featDevicesTitle" as const, bodyKey: "featDevicesBody" as const },
];

const promoCards = [
  { titleKey: "promoWelcome" as const, image: promoWelcome },
  { titleKey: "promoDaily" as const, image: promoDaily },
  { titleKey: "promoVipCashback" as const, image: promoVip },
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

const popupImages = [
  "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/3013088_1749471837701.png",
  "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/3013088_1747144146761.png",
  "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/3026578_1781775033023.gif",
  "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/1782533197055_PKOK.jpg",
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
      
    </SiteShell>
  );
}

function PromoPopup() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const { t } = useLang();
  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(timer);
  }, []);
  if (!open) return null;
  const total = popupImages.length;
  const next = () => {
    if (idx < total - 1) setIdx(idx + 1);
    else setOpen(false);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md">
        <button
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute -right-2 -top-10 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/60 text-white hover:bg-[var(--neon-green)]/70"
        >
          ✕
        </button>
        <img
          src={popupImages[idx]}
          alt={`Promo ${idx + 1}`}
          className="w-full rounded-lg shadow-2xl"
        />
        <div className="mt-4 flex items-center justify-between text-white">
          <div className="flex gap-1.5">
            {popupImages.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-[var(--neon-gold)]" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="rounded-full bg-[var(--neon-green)] px-5 py-2 text-sm font-semibold text-black hover:brightness-110"
          >
            {idx < total - 1 ? t("popupNext") : t("popupClose")}
          </button>
        </div>
      </div>
    </div>
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
    <section id="home" className="w-full">
      <div className="relative w-full overflow-hidden border-b border-black/20 aspect-[1920/720] sm:aspect-[1920/640] md:aspect-[1920/600] lg:aspect-[1920/580] xl:aspect-[1920/560]">

        <img
          key={idx}
          src={slide.image}
          alt={slide.alt}
          width={1920}
          height={768}
          className="absolute inset-0 block h-full w-full animate-fade-in object-cover"
        />

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
  const { t } = useLang();
  const items = [
    "✅ PKOK.COM",
    "✅ PKOK.WIN",
    "✅ PKOK.BET",
    t("tickerLuckyRed"),
    t("tickerDailyTourney"),
    t("tickerVip"),
    t("tickerBonus"),
    t("tickerFastDW"),
  ];
  const loop = [...items, ...items];
  return (
    <section className="w-full border-y border-white/10 bg-black/60">
      <div className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium leading-none text-white/95 sm:px-4 sm:text-[14px] lg:px-6">
        <span className="shrink-0 grid h-7 w-7 place-items-center rounded-full bg-[var(--neon-green)]/25 text-[var(--neon-green)] ring-1 ring-[var(--neon-green)]/40 sm:h-8 sm:w-8">
          <Megaphone className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)]">
          <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
            {loop.map((it, i) => (
              <span key={i} className="inline-flex items-center gap-2 tracking-wide">
                <span>{it}</span>
                <span className="text-[var(--neon-gold)]/70">•</span>
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 grid h-7 w-7 place-items-center rounded-full bg-[var(--neon-gold)]/20 text-[var(--neon-gold)] ring-1 ring-[var(--neon-gold)]/40 sm:h-8 sm:w-8">
          <Bell className="h-4 w-4" />
        </span>
      </div>
    </section>
  );
}


function HotGamesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLang();
  const [paused, setPaused] = useState(false);

  const scrollBy = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || paused) return;
    const id = setInterval(() => {
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const cardStep = el.clientWidth / (window.innerWidth >= 1024 ? 6 : window.innerWidth >= 640 ? 3 : 2);
      if (el.scrollLeft + cardStep >= maxScroll - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardStep, behavior: "smooth" });
      }
    }, 2400);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
      <div className="rounded-2xl inset-panel p-4 sm:p-5 lg:p-6">
        <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5">
          <div className="flex items-center gap-2 text-lg font-black text-[var(--neon-gold)] sm:text-xl lg:text-2xl">
            <Flame className="h-6 w-6 sm:h-7 sm:w-7" /> {t("hotGames")}
          </div>
          <button className="rounded-full bg-green-button px-5 py-2 text-sm font-black text-[var(--background)] sm:px-6 sm:py-2.5 sm:text-base">{t("more")}</button>
        </div>


        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <button
            aria-label="Previous"
            onClick={() => scrollBy(-1)}
            className="absolute -left-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white shadow-md backdrop-blur transition hover:bg-[var(--neon-green)]/70 sm:-left-3 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div
            ref={ref}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {hotGames.map((game) => (
              <div
                key={game.title}
                className="game-frame relative w-[44%] shrink-0 snap-start overflow-hidden rounded-xl p-2 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.03] sm:w-[32%] md:w-[24%] lg:w-[15.5%]"
              >
                {game.tag && (
                  <span className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-black ${game.tag === "HOT" ? "bg-[var(--neon-pink)] text-white" : "bg-[var(--neon-gold)] text-[var(--background)]"}`}>
                    {game.tag}
                  </span>
                )}
                <span className="absolute right-2 top-2 z-10 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-[var(--neon-gold)]">
                  {game.provider}
                </span>
                <img src={game.image} alt={game.title} width={512} height={512} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" />
                <div className="pt-3 text-center text-[13px] font-semibold text-foreground/90 sm:text-[14px] lg:text-[15px]">{game.title}</div>
              </div>
            ))}

          </div>
          <button
            aria-label="Next"
            onClick={() => scrollBy(1)}
            className="absolute -right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-[var(--neon-green)]/40 text-white shadow-md backdrop-blur transition hover:bg-[var(--neon-green)]/70 sm:-right-3 sm:h-10 sm:w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}




function JackpotSection() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-[1440px] px-3 pb-5 sm:px-4 lg:px-6">
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-black text-[var(--neon-gold)]"><Gift className="h-4 w-4" /> {t("promo")}</div>
          {promoCards.map((card) => (
            <div key={card.titleKey} className="overflow-hidden rounded-xl border border-[var(--neon-green)]/45 bg-black/35">
              <img src={card.image} alt={t(card.titleKey)} width={1024} height={512} loading="lazy" className="block w-full" />
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--neon-green)]/45 bg-[radial-gradient(ellipse_at_top,rgba(22,80,54,0.6),rgba(4,18,12,0.95))] p-3 text-center">
          <img
            src={jackpotHero}
            alt="Jackpots"
            width={1024}
            height={768}
            loading="lazy"
            className="mx-auto -mb-2 w-full max-w-[440px] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)]"
          />
          <JackpotCounter />
        </div>


        <LatestWinners />
      </div>
    </section>
  );
}

function LatestWinners() {
  const { t } = useLang();
  const winners = [
    { name: "*******526", game: "Wild Bounty Showdown", amount: "৳46,080", image: g12 },
    { name: "*******968", game: "Aviator", amount: "৳45,450", image: g8 },
    { name: "*******478", game: "Anubis Wrath", amount: "৳45,000", image: g6 },
    { name: "*******471", game: "Lightning Roulette", amount: "৳43,500", image: g2 },
    { name: "*******589", game: "সুপার উইন", amount: "৳42,150", image: g1 },
    { name: "*******409", game: "লাকি স্পিন", amount: "৳40,200", image: g7 },
    { name: "*******324", game: "ক্র্যাশ টাইম", amount: "৳38,900", image: g3 },
    { name: "*******279", game: "মেগা রিচ", amount: "৳36,350", image: g11 },
  ];
  const loop = [...winners, ...winners];
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--neon-gold)]"><Trophy className="h-4 w-4" /> {t("latestWinners")}</div>
      <div className="relative h-[360px] overflow-hidden rounded-xl border border-[var(--neon-green)]/40 bg-black/35 p-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="flex flex-col gap-2 animate-marquee-y">
          {loop.map((entry, i) => (
            <div key={`${entry.name}-${i}`} className="flex shrink-0 items-center gap-3 rounded-lg border border-[var(--neon-green)]/30 bg-black/55 p-2">
              <img src={entry.image} alt="" loading="lazy" decoding="async" className="h-10 w-10 shrink-0 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-white">{entry.name}</div>
                <div className="truncate text-[10px] text-foreground/65">{t("justWonIn")} <span className="text-[var(--neon-gold)]">{entry.game}</span></div>
              </div>
              <div className="shrink-0 text-sm font-black text-[var(--neon-gold)]">{entry.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JackpotCounter() {
  const [value, setValue] = useState(438097079);
  useEffect(() => {
    const t = setInterval(() => setValue((v) => v + Math.floor(Math.random() * 90) + 10), 1500);
    return () => clearInterval(t);
  }, []);
  const str = value.toLocaleString("en-US").replace(/,/g, ".");
  return (
    <div className="mt-2 inline-flex items-center gap-0.5 rounded-xl bg-black/70 px-3 py-2 sm:px-4">
      {str.split("").map((ch, i) =>
        ch === "." ? (
          <span key={i} className="px-0.5 text-3xl font-black text-[var(--neon-gold)] sm:text-5xl">.</span>
        ) : (
          <DigitReel key={i} digit={Number(ch)} />
        ),
      )}
    </div>
  );
}

function DigitReel({ digit }: { digit: number }) {
  return (
    <span className="relative inline-block h-9 w-6 overflow-hidden rounded-sm bg-gradient-to-b from-[#3a2a08] to-[#0d0904] text-center sm:h-12 sm:w-8">
      <span
        className="absolute left-0 right-0 top-0 flex flex-col text-3xl font-black text-[var(--neon-gold)] transition-transform duration-700 ease-out sm:text-5xl"
        style={{ transform: `translateY(-${digit * 10}%)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="block h-9 leading-9 sm:h-12 sm:leading-[3rem]">{n}</span>
        ))}
      </span>
    </span>
  );
}




function MainCategoryCards() {
  const { t } = useLang();
  return (
    <section className="category-strip">
      <div className="category-reference-wrap mx-auto">
        <img
          src={categoryReference.url}
          alt="Slot, Fishing, Live and Poker game categories"
          width={1487}
          height={372}
          loading="lazy"
          className="category-reference-img"
        />
        {mainCategories.map((item) => (
          <button
            key={item.key}
            aria-label={t(item.key)}
            className={`category-hit category-hit-${item.key}`}
          >
            <span className="sr-only">{t(item.key)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}




function AppSection() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-[1440px] px-3 pb-8 sm:px-4 lg:px-6">
      <div className="grid items-center gap-6 rounded-3xl border border-[var(--neon-green)]/45 panel-dark p-4 sm:p-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl sm:min-h-[380px] lg:min-h-[440px]">
          <img
            src={mascotAppScene}
            alt="PKOK app preview with mascots"
            width={1280}
            height={1024}
            loading="lazy"
            className="relative w-full max-w-md animate-float drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
          />
        </div>
        <div>
          <div className="text-sm font-bold text-white sm:text-base">{t("appTagline")}</div>
          <h2 className="mt-1 flex items-center gap-3 text-4xl font-black text-gradient-gold sm:text-5xl">
            <span>PKOK APP</span>
            <span aria-hidden className="h-[3px] flex-1 rounded-full bg-gradient-to-r from-[var(--neon-gold)] to-transparent" />
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-foreground/80 sm:text-base">{t("appDescription")}</p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:max-w-md">
            {[
              { label: "Android APP", Icon: Download },
              { label: "IOS APP", Icon: Apple },
            ].map(({ label, Icon }) => (
              <div key={label} className="rounded-2xl border border-[var(--neon-green)]/40 bg-black/35 p-3 text-center">
                <div className="mx-auto grid h-28 w-28 place-items-center rounded-lg bg-white text-[var(--background)] sm:h-32 sm:w-32">
                  <QrCode className="h-20 w-20" strokeWidth={1.5} />
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



function ServiceStats() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-[1440px] px-3 pb-3 pt-2 sm:px-4 lg:px-6">
      <div className="mb-3 flex justify-center">
        <div className="rounded-xl bg-green-button px-10 py-1.5 text-base font-black text-[var(--background)] shadow-lg sm:text-lg">
          {t("serviceQualityTitle")}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.labelKey} className="rounded-2xl border border-[var(--neon-green)]/45 bg-black/50 px-3 py-3 text-center">
            <div className="flex items-baseline justify-center">
              <span className="text-5xl font-black text-[var(--neon-gold)] leading-none sm:text-6xl">{item.value}</span>
              {item.unit && <span className="ml-0.5 text-base font-bold text-[var(--neon-gold)] sm:text-xl">{item.unit}</span>}
            </div>
            <div className="mx-auto mt-3 w-full rounded-full bg-green-button px-3 py-1 text-[11px] font-black text-[var(--background)] sm:text-xs">
              {t(item.labelKey)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureList() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-[1440px] space-y-2.5 px-3 pb-6 sm:px-4 lg:px-6">
      {featureCards.map((card) => (
        <div key={card.titleKey} className="rounded-2xl border border-[var(--neon-green)]/45 bg-black/50 p-3 sm:p-3.5">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={card.icon} alt="" loading="lazy" width={64} height={64} className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14" />
            <div className="min-w-0">
              <h3 className="text-sm font-black text-[var(--neon-gold)] sm:text-base">{t(card.titleKey)}</h3>
              <p className="mt-0.5 text-[11px] leading-5 text-foreground/80 sm:text-xs sm:leading-5">{t(card.bodyKey)}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}




const providerLogos = [
  { code: "UG2", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/754e19ab-6468-4ad2-8925-41862d9e33df/UG2-COLOR.png" },
  { code: "PIN", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/acb37937-359c-47bd-9856-8e28993ae8fe/PIN-COLOR.png" },
  { code: "POLY", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/0dabc83a-63bc-4cd2-8d71-902c3f6e7f47/POLY-COLOR.png" },
  { code: "SV3", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/d9698b36-7459-40ff-a0b3-d40a9887ba47/SV3-COLOR.png" },
  { code: "RCB", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/5b3c11e8-5fb5-4ef5-bb4f-a48a7bfa2e48/RCB-COLOR.png" },
  { code: "SB", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/255abfe1-501c-45cd-944a-b2beb4557907/SB-COLOR.png" },
  { code: "TF", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/87565e51-dd11-4899-b276-a0c9e8e20543/TF-COLOR.png" },
  { code: "IA", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/7153b519-e3de-4baf-b4be-f4ffa2fd339e/IA-COLOR.png" },
  { code: "KP", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/987d86ae-c70f-43eb-9761-df73ee0e6450/KP-COLOR.png" },
  { code: "TCG_SEA", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/4018affa-6235-4e7e-a94c-19bad1c61fa5/TCG_SEA-COLOR.png" },
  { code: "JL", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/1de00f05-8fa9-4614-9ccc-abf0ec678c4f/JL-COLOR.png" },
  { code: "NS", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/78017c6e-2d8d-4e36-b2a7-1b9adc0b5f6b/NS-COLOR.png" },
  { code: "SPB", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/0baaca92-6ce1-4bc4-81a8-9f9fa9057f1c/SPB-COLOR.png" },
  { code: "PG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/d9142294-83a1-4e6d-b997-1f88f4d12abd/PG-COLOR.png" },
  { code: "JDB", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/25b9399f-3f0a-456e-9849-0708f785e503/JDB-COLOR.png" },
  { code: "FC", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/def47ca7-d84b-4d9e-9471-12ca31d3402c/FC-COLOR.png" },
  { code: "BNG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/7e17a32e-40bf-45f5-9a1d-818be4dc3593/BNG-COLOR.png" },
  { code: "PP", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/5301ca3f-b9f8-4850-80db-c31b63c04d68/PP-COLOR.png" },
  { code: "MG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/b1c6ae02-61d7-436d-a67e-f3a682eec3ce/MG-COLOR.png" },
  { code: "BT", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/44c7f762-2b7e-410a-ba0f-b7dddf7e85e6/BT-COLOR.png" },
  { code: "SG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/2ebb0bb4-3c5e-448e-85d4-4a8adb76f12f/SG-COLOR.png" },
  { code: "SS", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/f7ac7f9a-e7fb-4dc3-a689-75ba2bc3c04c/SS-COLOR.png" },
  { code: "YB", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/cc9e4e7e-10fc-44b9-938e-efe1e6ed779b/YB-COLOR.png" },
  { code: "PS", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/bd6df9fa-73f1-45ab-9c4b-574d86e4d4e7/PS-COLOR.png" },
  { code: "AMG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/8b5cbe49-3e67-4ed5-b390-f414ce2b7669/AMG-COLOR.png" },
  { code: "FS", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/145e696f-ae9d-45d3-b711-e89659c1c3fc/FS-COLOR.png" },
  { code: "WD", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/c55cac9b-0ac4-40ad-ab1e-601c4adc086a/WD-COLOR.png" },
  { code: "GM", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/78fb5550-d181-4dc1-9ee1-7cbba16121b4/GM-COLOR.png" },
  { code: "5G", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/c23c586e-c82c-4a5c-ba59-17dcc29f6795/5G-COLOR.png" },
  { code: "BOM", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/85cafbef-f321-43a5-953e-e260b22fb041/BOM-COLOR.png" },
  { code: "KA", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/d59eb370-3676-48c2-b005-4ecf6321ab70/KA-COLOR.png" },
  { code: "BGA", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/153111b7-b6e3-40b6-96d9-64a2f13d87e4/BGA-COLOR.png" },
  { code: "L22", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/01879081-e976-4f1e-b7d2-3fe6327b31ac/L22-COLOR.png" },
  { code: "VA", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/72b03c3a-f52f-4497-b3e7-351886271b6a/VA-COLOR.png" },
  { code: "HS", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/9f06f089-5043-4108-983d-bc8b4931d9af/HS-COLOR.png" },
  { code: "JK", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/563fb4e3-4bbe-4bb5-937a-76a3392b9c35/JK-COLOR.png" },
  { code: "NG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/fd6d2154-02aa-43ca-a9eb-26dc115f52c2/NG-COLOR.png" },
  { code: "AMBS", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/23de1d2f-ba39-4228-8913-8bf497436d08/AMBS-COLOR.png" },
  { code: "MAS", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/18056f08-98bf-47dd-ac65-c06666d99d0a/MAS-COLOR.png" },
  { code: "MAHA", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/382d3c10-ead5-48fe-a6c7-3ad11cb2f248/MAHA-COLOR.png" },
  { code: "AE", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/afe2343e-4b89-4cdf-89c2-84f1d2846587/AE-COLOR.png" },
  { code: "FTG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/4a650605-f1c0-4288-821b-548e0534843a/FTG-COLOR.png" },
  { code: "EZG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/14ffcb4b-6e13-4b99-b1a9-ecca38da83c5/EZG-COLOR.png" },
  { code: "MA", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/573024b3-552f-44e2-9579-46eff0492e02/MA-COLOR.png" },
  { code: "EP", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/8d0d97f1-f866-41dc-afd5-46e6a699c281/EP-COLOR.png" },
  { code: "RLX", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/2dc1e649-a98f-4ba4-9121-6d86567833f0/RLX-COLOR.png" },
  { code: "TPG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/380bc17f-a270-409c-b591-2b2189fdd9ee/TPG-COLOR.png" },
  { code: "AUX", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/36e94dd9-2f15-4bfc-9fa0-462aedcb29a9/AUX-COLOR.png" },
  { code: "PAS", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/052d703f-a217-40aa-bc80-07e2b3b0eb3d/PAS-COLOR.png" },
  { code: "OCT", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/a3d2816e-b9d5-402a-b097-2b38b3d7091c/OCT-COLOR.png" },
  { code: "GPI", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/77926c45-c85a-4bf6-b440-71dcef3f08fc/GPI-COLOR.png" },
  { code: "RT", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/d328886b-9cd5-4ffa-b212-46a13af87556/RT-COLOR.png" },
  { code: "CG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/3069aeae-58a1-4971-bc37-69a610f20ba2/CG-COLOR.png" },
  { code: "NE", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/ea996c34-d1bb-434b-8c7a-d0a934420942/NE-COLOR.png" },
  { code: "BTG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/e44a406c-bd77-424c-a3f8-9015a8e442b8/BTG-COLOR.png" },
  { code: "NLC", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/11d6f71c-2b06-49a9-b1f1-6bb4a8784374/NLC-COLOR.png" },
  { code: "YGD", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/a899e0b1-3f0b-43f4-9b7c-c2a3339dbc8e/YGD-COLOR.png" },
  { code: "BSP", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/5096bca5-eac9-4f6a-8d2d-c576e631a845/BSP-COLOR.png" },
  { code: "FP", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/67074cc8-430e-46d2-9207-606bcf1b08d1/FP-COLOR.png" },
  { code: "PT", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/d0f43f75-55b2-4a4b-a59f-f61b6ecbf408/PT-COLOR.png" },
  { code: "AVT", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/a621de54-a31e-4bc6-8448-766111deef83/AVT-COLOR.png" },
  { code: "IO", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/a67f5af6-7005-4fcb-93d0-341390f3cca5/IO-COLOR.png" },
  { code: "RP", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/0f261c24-9eac-4ff9-a953-a9d07e8e155c/RP-COLOR.png" },
  { code: "EGT", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/3eafa598-d59f-4926-b5cb-4088918687a5/EGT-COLOR.png" },
  { code: "BBR", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/6c40352e-7f3b-45ac-8b8c-7f510b255dcf/BBR-COLOR.png" },
  { code: "TB", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/b72ddaaf-ab03-41b4-a5f3-74327c8dbf80/TB-COLOR.png" },
  { code: "ID", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/ea4e7980-30ca-48a2-af22-8a38ca8df86e/ID-COLOR.png" },
  { code: "WS", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/5a890463-65cb-4a1d-bc01-6a9a4a2af880/WS-COLOR.png" },
  { code: "CQ9", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/27728efc-5951-4541-a441-6925cc1455c3/CQ9-COLOR.png" },
  { code: "KM", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/7cdd4506-db5b-4991-9093-7a8ed420d8b2/KM-COLOR.png" },
  { code: "R88", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/0884b560-b474-403e-b27e-cd1eb633a63d/R88-COLOR.png" },
  { code: "MW", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/ea120ba3-174f-4dc5-bd7f-d39345fe9059/MW-COLOR.png" },
  { code: "RG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/a84398fd-9890-40fd-aaea-7c38807534e4/RG-COLOR.png" },
  { code: "2J", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/d03badb9-f7b5-4b4a-8bcc-3659930a4472/2J-COLOR.png" },
  { code: "SWG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/1c5752c0-8026-4837-8233-e13b4abff15e/SWG-COLOR.png" },
  { code: "EG4", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/3dc85557-01ad-4cf5-bff4-a69f773c3944/EG4-COLOR.png" },
  { code: "SEX", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/59baaff0-42ba-4776-a5ad-94f7958bfece/SEX-COLOR.png" },
  { code: "EZ", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/89bbab34-0e4a-408b-a40d-ee930cbd3533/EZ-COLOR.png" },
  { code: "VIA", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/6b3484d6-e842-4a36-8d17-87011e6c380a/VIA-COLOR.png" },
  { code: "WJ", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/e947c3a6-a465-4d95-a202-18bc762b3787/WJ-COLOR.png" },
  { code: "AIL", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/b9a0daf8-5955-49cb-a58e-a4d71416d2fa/AIL-COLOR.png" },
  { code: "SA", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/c8ee33d4-ebf7-4c6f-87c4-5a14a7f9ce5f/SA-COLOR.png" },
  { code: "DG", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/208193ce-c47c-462c-9e7c-621535c2ca15/DG-COLOR.png" },
  { code: "U9W", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/7bb2e50b-0078-42db-9370-9cd9da5ceb31/U9W-COLOR.png" },
  { code: "LUC", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/42ee4b4f-1b10-4ee8-a704-781fac3fcb8f/LUC-COLOR.png" },
  { code: "BTI", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/4162229a-2055-491c-beff-54efaea79a0c/BTI-COLOR.png" },
  { code: "FB", src: "https://pkok-clone-vibes.lovable.app/__l5e/assets-v1/690e1eff-93d5-483c-980f-f2b64207d576/FB-COLOR.png" },
];

function ProviderStrip() {
  return (
    <section className="bg-black py-10">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        <div className="mb-6 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-foreground/55">
          আমাদের গেম প্রোভাইডার
        </div>
        <div className="grid grid-cols-3 gap-x-5 gap-y-6 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10">
          {providerLogos.map((logo) => (
            <div key={logo.code} className="flex h-12 items-center justify-center" title={logo.code}>
              <img
                src={logo.src}
                alt={`${logo.code} provider logo`}
                width={132}
                height={44}
                loading="lazy"
                className="max-h-10 w-full object-contain transition duration-200 hover:scale-105"
              />
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
    <section id={section.id} className="mx-auto max-w-[1440px] px-3 py-6 sm:px-4 lg:px-6">
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

