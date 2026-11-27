import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, Heart, Play } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/landing/SiteShell";
import {
  HOT_296_GAMES,
  LIVE_ONLY_PROVIDERS,
  VENDOR_LOGO_WHITE,
  type HotCatalogGame,
} from "@/data/hot296Games";

export const Route = createFileRoute("/esports")({
  head: () => ({
    meta: [
      { title: "গরম খেলা — PKOK" },
      { name: "description", content: "সর্বাধিক জনপ্রিয় গরম গেমস — JILI, PG, SPRIBE, JDB, FC, Evolution সহ শীর্ষ প্রোভাইডারের গেম।" },
      { property: "og:title", content: "গরম খেলা — PKOK" },
      { property: "og:description", content: "আজকের সবচেয়ে জনপ্রিয় হট গেমগুলো এক জায়গায়।" },
    ],
  }),
  component: HotGamesShowcasePage,
});

const FAV_KEY = "pkok_hot_favs_v1";

function loadFavs(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((x) => typeof x === "number")) : new Set();
  } catch {
    return new Set();
  }
}

function HotGamesShowcasePage() {
  const navigate = useNavigate();
  const [favs, setFavs] = useState<Set<number>>(new Set());

  useEffect(() => {
    setFavs(loadFavs());
  }, []);

  const toggleFav = (idx: number) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      try {
        window.localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleLaunch = (g: HotCatalogGame) => {
    if (g.to) {
      void navigate({ to: g.to });
      return;
    }
    toast.info(`🎮 ${g.title} — এই গেমটি শীঘ্রই তৈরি করা হবে`);
  };

  return (
    <SiteShell>
      <main
        className="flex min-h-[calc(100vh-122px)] w-full items-start justify-center px-2 py-5 sm:px-4 sm:py-[40px]"
        style={{
          backgroundColor: "#133a25",
          backgroundImage:
            "radial-gradient(ellipse at 50% 0%, rgba(34,225,110,0.08), transparent 60%)",
        }}
      >
        <section
          aria-label="গরম খেলা"
          className="w-full max-w-[1200px] overflow-hidden rounded-[12px] bg-white shadow-[0_14px_40px_rgba(0,0,0,0.38)]"
        >
          {/* Exact #128547 Top Title Header */}
          <div className="flex items-center gap-[8.3px] bg-[#128547] px-4 py-3 sm:px-[20px] sm:py-[16px]">
            <Flame className="h-[30px] w-[30px] shrink-0 fill-orange-500 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] sm:h-[35px] sm:w-[35px]" />
            <h1 className="text-[18px] font-bold leading-none text-white sm:text-[20px]">
              গরম খেলা
            </h1>
          </div>

          {/* Centered 960px 6-column grid matching 54897843543.com/hot */}
          <div className="mx-auto w-full max-w-[960px] px-3 py-5 sm:px-4 sm:py-[30px] lg:px-0">
            <div className="grid grid-cols-3 gap-x-[10px] gap-y-[20px] sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 lg:gap-x-[12px] lg:gap-y-[30px]">
              {HOT_296_GAMES.map((g) => (
                <HotGameCard
                  key={`${g.i}-${g.provider}-${g.title}`}
                  game={g}
                  isFav={favs.has(g.i)}
                  onToggleFav={() => toggleFav(g.i)}
                  onPlay={() => handleLaunch(g)}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

function HotGameCard({
  game,
  isFav,
  onToggleFav,
  onPlay,
}: {
  game: HotCatalogGame;
  isFav: boolean;
  onToggleFav: () => void;
  onPlay: () => void;
}) {
  const [vendorErr, setVendorErr] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const hasFreeTrial = !LIVE_ONLY_PROVIDERS.has(game.provider);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPlay();
        }
      }}
      className="group relative flex cursor-pointer flex-col overflow-hidden text-left focus:outline-none"
    >
      {/* Square bordered #16251d tile with 2px #22e16e neon border */}
      <div className="relative aspect-square w-full overflow-hidden rounded-[12px] border-2 border-[#22e16e] bg-[#16251d] p-[6px] sm:p-[10px]">
        <img
          src={
            imgErr
              ? "https://images.23924894.com/TCG_GAME_ICONS/JL/EN/JL0036.avif?t=1795721437000"
              : game.img
          }
          alt={game.title}
          loading="lazy"
          onError={() => setImgErr(true)}
          className="h-full w-full rounded-[10px] object-cover sm:rounded-[12px]"
        />

        {/* Top-left vendor pill */}
        <div
          className="absolute top-[6px] left-[6px] z-[3] flex items-center justify-center rounded-tl-[10px] rounded-br-[12px] px-1.5 py-0.5 shadow sm:top-[10px] sm:left-[10px]"
          style={{ background: "linear-gradient(180deg, #22e16e, #097739)" }}
        >
          {vendorErr ? (
            <span className="px-1 text-[10px] font-black tracking-wide text-white">
              {game.provider === "JL" ? "JILI" : game.provider}
            </span>
          ) : (
            <img
              src={VENDOR_LOGO_WHITE(game.provider)}
              alt={game.provider}
              loading="lazy"
              onError={() => setVendorErr(true)}
              className="h-[18px] w-[36px] object-contain sm:h-[22px] sm:w-[46px]"
            />
          )}
        </div>

        {/* Top-right favorite heart icon */}
        <button
          type="button"
          aria-label="Favorite"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFav();
          }}
          className="absolute top-[9px] right-[9px] z-[20] grid h-6 w-6 place-items-center transition-transform hover:scale-110 sm:top-[13px] sm:right-[13px]"
        >
          <Heart
            className={`h-4 w-4 sm:h-5 sm:w-5 ${
              isFav
                ? "fill-[#f85e06] text-[#f85e06]"
                : "fill-black/25 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
            }`}
          />
        </button>

        {/* Hover overlay (.btn-dice) with green circular Play button & Free Trial */}
        <div className="pointer-events-none absolute inset-0 z-[10] flex scale-75 flex-col items-center justify-center gap-2 rounded-[12px] bg-[rgba(19,58,37,0.58)] opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
          <span
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 border-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.45)] sm:h-[50px] sm:w-[50px]"
            style={{ background: "linear-gradient(180deg, #22e16e, #0b8d42)" }}
          >
            <Play className="h-5 w-5 translate-x-[1px] fill-white text-white sm:h-6 sm:w-6" />
          </span>
          {hasFreeTrial && (
            <span className="text-[11px] font-medium text-white underline underline-offset-2 drop-shadow sm:text-[13px]">
              ফ্রি ট্রায়াল
            </span>
          )}
        </div>
      </div>

      {/* Centered #000 game title below card */}
      <p className="w-full truncate pt-[8px] text-center text-[12px] font-normal text-black sm:pt-[10px] sm:text-[14px]">
        {game.title}
      </p>
    </div>
  );
}
