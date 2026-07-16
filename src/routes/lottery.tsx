import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Ticket } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { ComingSoonBanner } from "@/components/landing/ComingSoonBanner";
import tcgImg from "@/assets/lott/tcg.jpg";
import tcgseaImg from "@/assets/lott/tcgsea.jpg";
import vrImg from "@/assets/lott/vr.jpg";
import gpiImg from "@/assets/lott/gpi.jpg";
import lottImg from "@/assets/lott/lott.jpg";

export const Route = createFileRoute("/lottery")({
  head: () => ({
    meta: [
      { title: "লটারি ও বিঙ্গো — Asik Game" },
      { name: "description", content: "TC Gaming, TCG SEA, VR, GPI সহ প্রিমিয়াম লটারি ও বিঙ্গো প্রোভাইডার।" },
      { property: "og:title", content: "লটারি ও বিঙ্গো — Asik Game" },
      { property: "og:description", content: "ভাগ্য পরীক্ষা করুন লটারি ও বিঙ্গো গেমসে।" },
    ],
  }),
  component: LotteryPage,
});

type Provider = { code: string; name: string; hero: string };

const lottProviders: Provider[] = [
  { code: "TCG",     name: "TC Gaming",  hero: tcgImg },
  { code: "TCG_SEA", name: "TCG SEA",    hero: tcgseaImg },
  { code: "VR",      name: "VR Lottery", hero: vrImg },
  { code: "GPI",     name: "GPI Keno",   hero: gpiImg },
  { code: "LOTT",    name: "Lucky Lott", hero: lottImg },
];

const vendorLogoBase = "https://images.23924894.com/TCG_PROD_IMAGES/ELOTT_LIST_VENDOR";

function LotteryPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return lottProviders;
    return lottProviders.filter((p) => p.name.toUpperCase().includes(q) || p.code.toUpperCase().includes(q));
  }, [query]);

  return (
    <SiteShell>
      <h1 className="sr-only">লটারি ও বিঙ্গো</h1>
      <section
        className="game-lobby ELOTT"
        aria-label="Lottery providers"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(255,220,120,0.20), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(120,200,255,0.14), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        <div className="mx-auto mb-6 flex w-[1200px] max-w-[calc(100vw-96px)] flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(180deg,#0f5a34,#083f22)] px-4 py-2 ring-1 ring-[var(--neon-green)]/50">
            <Ticket className="h-5 w-5 text-[var(--neon-gold)]" />
            <h2 className="text-base font-bold tracking-wide text-[var(--neon-gold)]">লটারি প্রোভাইডার</h2>
            <span className="ml-2 rounded-full bg-black/40 px-2 py-0.5 text-xs font-bold text-white">
              {lottProviders.length} প্রোভাইডার
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
          <div className="game-list">
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
      aria-label={`${p.name} lottery`}
      style={{ animationDelay: `${Math.min(index * 40, 600)}ms`, animationFillMode: "backwards" }}
    >
      <div className="relative w-full overflow-hidden rounded-lg">
        <img
          src={p.hero}
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
          LOTTO
        </span>
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-0 ring-[var(--neon-gold)] transition-all duration-300 group-hover:ring-2 group-hover:shadow-[0_10px_28px_rgba(255,215,80,0.35)]" />
      </div>
    </button>
  );
}
