import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Spade } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { ComingSoonBanner } from "@/components/landing/ComingSoonBanner";

export const Route = createFileRoute("/poker")({
  head: () => ({
    meta: [
      { title: "পোকার ও PVP গেমস — Asik Game" },
      { name: "description", content: "Baison Games, King's Poker, KINGMIDAS, Rich88, RG Rich Game, SM Gaming সহ প্রিমিয়াম PVP পোকার প্রোভাইডার।" },
      { property: "og:title", content: "পোকার ও PVP গেমস — Asik Game" },
      { property: "og:description", content: "Texas Holdem থেকে Video Poker — সব PVP প্রোভাইডার এক জায়গায়।" },
    ],
  }),
  component: PokerPage,
});

type Provider = { code: string; name: string; icon: string };

const B = "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/";
const D = "https://images.23924894.com/prod-images/game_icon/default/bigImage/";

const pvpProviders: Provider[] = [
  { code: "BSP", name: "Baison Games", icon: B + "gcs__PVP-BSP_1751638717385.webp" },
  { code: "KP",  name: "King's Poker", icon: B + "gcs__PVP-KP_1751638717629.webp" },
  { code: "KM",  name: "KINGMIDAS",    icon: D + "gcs__pvp-km_1706608967801.avif" },
  { code: "R88", name: "Rich88",       icon: D + "gcs__pvp-r88_1754315236997.avif" },
  { code: "RG",  name: "RG Rich Game", icon: B + "gcs__PVP-RG_1774541712739.webp" },
  { code: "SWG", name: "SM Gaming",    icon: D + "gcs__pvp-swg_1706167637933.avif" },
];

const vendorLogoBase = "https://images.23924894.com/TCG_PROD_IMAGES/RNG_LIST_VENDOR";

function PokerPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return pvpProviders;
    return pvpProviders.filter((p) => p.name.toUpperCase().includes(q) || p.code.toUpperCase().includes(q));
  }, [query]);

  return (
    <SiteShell>
      <h1 className="sr-only">পোকার ও PVP গেমস</h1>
      <div className="pt-4">
        <ComingSoonBanner
          title="পোকার provider শীঘ্রই চালু হচ্ছে"
          message="King's Poker, KINGMIDAS, Rich88 সহ PVP poker provider এর real integration এখনো active নয়।"
          providers={["King's Poker", "KINGMIDAS", "Rich88", "RG Rich Game"]}
        />
      </div>
      <section
        className="game-lobby PVP"
        aria-label="PVP poker providers"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(255,120,180,0.18), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(255,220,120,0.14), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        <div className="mx-auto mb-6 flex w-[1200px] max-w-[calc(100vw-96px)] flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(180deg,#0f5a34,#083f22)] px-4 py-2 ring-1 ring-[var(--neon-green)]/50">
            <Spade className="h-5 w-5 text-[var(--neon-gold)]" />
            <h2 className="text-base font-bold tracking-wide text-[var(--neon-gold)]">PVP প্রোভাইডার</h2>
            <span className="ml-2 rounded-full bg-black/40 px-2 py-0.5 text-xs font-bold text-white">
              {pvpProviders.length} প্রোভাইডার
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 ring-1 ring-black/10">
            <Search className="h-4 w-4 text-black/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="প্রোভাইডার খুঁজুন..."
              className="w-40 border-none bg-transparent text-sm text-black placeholder:text-black/40 focus:outline-none sm:w-56"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/70">কোন প্রোভাইডার পাওয়া যায়নি</div>
        ) : (
          <div className="game-list" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
            {filtered.map((p, i) => (
              <ProviderCard key={p.code} p={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function ProviderCard({ p, index }: { p: Provider; index: number }) {
  return (
    <button
      className="lobby-item group animate-fade-in"
      aria-label={`${p.name} poker`}
      style={{ animationDelay: `${Math.min(index * 30, 600)}ms`, animationFillMode: "backwards" }}
    >
      <div className="relative w-full overflow-hidden rounded-lg">
        <img
          src={p.icon}
          alt=""
          loading="lazy"
          className="game-img transition-transform duration-500 group-hover:scale-110"
        />
        <img
          src={`${vendorLogoBase}/${p.code}-WHITE.png`}
          alt={p.name}
          loading="lazy"
          className="vendor-img transition-transform duration-300 group-hover:-translate-y-1"
        />
        <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-black text-[var(--neon-gold)] ring-1 ring-[var(--neon-gold)]/50 backdrop-blur">
          PVP
        </span>
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-0 ring-[var(--neon-gold)] transition-all duration-300 group-hover:ring-2 group-hover:shadow-[0_10px_28px_rgba(255,215,80,0.35)]" />
      </div>
    </button>
  );
}
