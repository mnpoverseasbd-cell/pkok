import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Fish } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";

export const Route = createFileRoute("/fish")({
  head: () => ({
    meta: [
      { title: "ফিশিং গেমস — Asik Game" },
      { name: "description", content: "JILI, FC, JDB, KA সহ শীর্ষ ফিশিং গেম প্রোভাইডার এক জায়গায়।" },
      { property: "og:title", content: "ফিশিং গেমস — Asik Game" },
      { property: "og:description", content: "প্রিমিয়াম ফিশ শুটিং ও আর্কেড গেম প্রোভাইডার।" },
    ],
  }),
  component: FishPage,
});

type Provider = { code: string; name: string; icon: string };

const B = "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/";

const fishProviders: Provider[] = [
  { code: "JL",   name: "JILI",         icon: B + "gcs__FISH-JL_1751638723406.webp" },
  { code: "FC",   name: "FA CHAI",      icon: B + "gcs__FISH-FC_1751638722918.webp" },
  { code: "JDB",  name: "JDB",          icon: B + "gcs__FISH-JDB_1751638723161.webp" },
  { code: "BT",   name: "BT GAMING",    icon: B + "gcs__FISH-BT_1751638722674.webp" },
  { code: "SG",   name: "Spadegaming",  icon: B + "gcs__FISH-SG_1751638723912.webp" },
  { code: "KA",   name: "KA Gaming",    icon: B + "gcs__FISH-KA_1751638723651.webp" },
  { code: "BSP",  name: "Baison",       icon: B + "gcs__FISH-BSP_1751638722430.webp" },
  { code: "TPG",  name: "TPG",          icon: B + "gcs__FISH-TPG_1751638720627.webp" },
  { code: "JK",   name: "Joker",        icon: B + "gcs__FISH-JK_1746086798334.webp" },
  { code: "AMBS", name: "askmeslot",    icon: B + "gcs__FISH-AMBS_1746086796615.webp" },
  { code: "FTG",  name: "FTG",          icon: B + "gcs__FISH-FTG_1746086797843.webp" },
  { code: "FS",   name: "FASTSPIN",     icon: B + "gcs__FISH-FS_1746086797595.webp" },
  { code: "VA",   name: "Victory Ark",  icon: B + "gcs__FISH-VA_1746086799589.webp" },
  { code: "MG",   name: "Microgaming",  icon: B + "gcs__FISH-MG_1746086798852.webp" },
  { code: "CQ9",  name: "CQ9 Gaming",   icon: B + "gcs__FISH-CQ9_1774541703593.webp" },
  { code: "MW",   name: "Megawin",      icon: B + "gcs__FISH-MW_1774541705942.webp" },
  { code: "SWG",  name: "SM Gaming",    icon: B + "gcs__FISH-SWG_1774541708093.webp" },
  { code: "2J",   name: "2J.COM",       icon: B + "gcs__FISH-2J_1774541699278.webp" },
];

const vendorLogoBase = "https://images.23924894.com/TCG_PROD_IMAGES/RNG_LIST_VENDOR";

function FishPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return fishProviders;
    return fishProviders.filter((p) => p.name.toUpperCase().includes(q) || p.code.toUpperCase().includes(q));
  }, [query]);

  return (
    <SiteShell>
      <h1 className="sr-only">ফিশিং গেমস</h1>
      <section
        className="game-lobby FISH"
        aria-label="Fish providers"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(120,200,255,0.18), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(255,220,120,0.14), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        <div className="mx-auto mb-6 flex w-[1200px] max-w-[calc(100vw-96px)] flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(180deg,#0f5a34,#083f22)] px-4 py-2 ring-1 ring-[var(--neon-green)]/50">
            <Fish className="h-5 w-5 text-[var(--neon-gold)]" />
            <h2 className="text-base font-bold tracking-wide text-[var(--neon-gold)]">ফিশিং প্রোভাইডার</h2>
            <span className="ml-2 rounded-full bg-black/40 px-2 py-0.5 text-xs font-bold text-white">
              {fishProviders.length} প্রোভাইডার
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
      aria-label={`${p.name} fish games`}
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
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-0 ring-[var(--neon-gold)] transition-all duration-300 group-hover:ring-2 group-hover:shadow-[0_10px_28px_rgba(255,215,80,0.35)]" />
      </div>
    </button>
  );
}
