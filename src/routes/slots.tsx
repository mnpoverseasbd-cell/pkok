import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Gamepad2 } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { ComingSoonBanner } from "@/components/landing/ComingSoonBanner";

export const Route = createFileRoute("/slots")({
  head: () => ({
    meta: [
      { title: "স্লট গেমস — Asik Game" },
      { name: "description", content: "JILI, PG, Pragmatic, JDB সহ ৬৫+ শীর্ষ স্লট প্রোভাইডারের হাজারো গেম এক জায়গায়।" },
      { property: "og:title", content: "স্লট গেমস — Asik Game" },
      { property: "og:description", content: "৬৫+ প্রিমিয়াম স্লট প্রোভাইডার, ৭০০০+ স্লট গেম।" },
    ],
  }),
  component: SlotsPage,
});


type Provider = { code: string; name: string; count: number; icon: string };

const rngProviders: Provider[] = [
  { code: "JL", name: "JILI", count: 222, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-JL_1751638719376.webp" },
  { code: "NS", name: "NS", count: 61, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-NS_1751638719886.webp" },
  { code: "SPB", name: "SPB", count: 11, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-SPB_1746086814181.webp" },
  { code: "PG", name: "PG", count: 166, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-PG_1751638720130.webp" },
  { code: "JDB", name: "JDB", count: 90, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-JDB_1751638718373.webp" },
  { code: "FC", name: "FC", count: 66, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-FC_1751638718129.webp" },
  { code: "BNG", name: "BNG", count: 185, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-BNG_1751638717885.webp" },
  { code: "PP", name: "PP", count: 670, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-PP_1751638720380.webp" },
  { code: "MG", name: "MG", count: 260, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-MG_1751638719641.webp" },
  { code: "BT", name: "BT", count: 125, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-BT_1746086805343.webp" },
  { code: "SG", name: "SG", count: 91, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-SG_1746086813938.png" },
  { code: "SS", name: "SS", count: 18, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-SS_1746086814424.png" },
  { code: "YB", name: "YB", count: 58, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-YB_1746086815400.webp" },
  { code: "PS", name: "PS", count: 86, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-PS_1746086813192.webp" },
  { code: "AMG", name: "AMG", count: 139, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-AMG_1746086803860.webp" },
  { code: "FS", name: "FS", count: 71, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-FS_1746086807531.webp" },
  { code: "WD", name: "WD", count: 206, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-WD_1746086815161.webp" },
  { code: "GM", name: "GM", count: 67, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-GM_1746086808034.webp" },
  { code: "5G", name: "5G", count: 33, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-5G_1746086802837.webp" },
  { code: "BOM", name: "BOM", count: 172, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-BOM_1746086804848.webp" },
  { code: "KA", name: "KA", count: 819, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-KA_1746086809247.webp" },
  { code: "BGA", name: "BGA", count: 255, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-BGA_1746086804364.png" },
  { code: "L22", name: "L22", count: 63, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-L22_1746086809491.webp" },
  { code: "VA", name: "VA", count: 51, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-VA_1746086814915.webp" },
  { code: "HS", name: "HS", count: 243, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-HS_1746086808526.webp" },
  { code: "JK", name: "JK", count: 317, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-JK_1746086809008.webp" },
  { code: "NG", name: "NG", count: 62, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-NG_1746086811194.webp" },
  { code: "AMBS", name: "AMBS", count: 60, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-AMBS_1746086803593.webp" },
  { code: "MAS", name: "MAS", count: 129, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-MAS_1746086810241.webp" },
  { code: "MAHA", name: "MAHA", count: 21, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-MAHA_1746086809995.webp" },
  { code: "AE", name: "AE", count: 49, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-AE_1746086803344.webp" },
  { code: "FTG", name: "FTG", count: 79, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-FTG_1746086807789.webp" },
  { code: "EZG", name: "EZG", count: 25, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-EZG_1746086806782.webp" },
  { code: "MA", name: "MA", count: 29, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-MA_1746086809750.webp" },
  { code: "EP", name: "Ep", count: 171, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-EP_1746086806291.webp" },
  { code: "RLX", name: "RLX", count: 159, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-RLX_1746086813434.webp" },
  { code: "TPG", name: "TPG", count: 80, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-TPG_1746086814664.webp" },
  { code: "AUX", name: "AUX", count: 43, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-AUX_1746086804115.webp" },
  { code: "PAS", name: "PAS", count: 88, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-PAS_1746086812432.webp" },
  { code: "OCT", name: "OCT", count: 143, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-OCT_1746086812191.webp" },
  { code: "GPI", name: "GPI", count: 170, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-GPI_1746086808279.webp" },
  { code: "RT", name: "RT", count: 361, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-RT_1746086813677.webp" },
  { code: "CG", name: "CG", count: 111, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-CG_1746086805938.webp" },
  { code: "NE", name: "NE", count: 210, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-NE_1746086810963.webp" },
  { code: "BTG", name: "BTG", count: 49, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-BTG_1746086805598.webp" },
  { code: "NLC", name: "NLC", count: 109, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-NLC_1746086811456.webp" },
  { code: "YGD", name: "YGD", count: 278, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-YGD_1746086815640.webp" },
  { code: "BSP", name: "BSP", count: 9, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-BSP_1746086805091.webp" },
  { code: "FP", name: "FP", count: 9, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-FP_1746086807284.webp" },
  { code: "PT", name: "PT", count: 591, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-PT_1747636423731.webp" },
  { code: "AVT", name: "AVT", count: 1, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-AVT_1773341671772.png" },
  { code: "IO", name: "IO", count: 36, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-IO_1773341672878.webp" },
  { code: "RP", name: "RP", count: 19, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-RP_1773505776694.webp" },
  { code: "EGT", name: "EGT", count: 195, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-EGT_1774541725213.webp" },
  { code: "BBR", name: "BBR", count: 110, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-BBR_1774541721083.webp" },
  { code: "TB", name: "TB", count: 43, icon: "https://images.23924894.com/prod-images/game_icon/default/bigImage/gcs__rng-tb_1751963294451.webp" },
  { code: "ID", name: "ID", count: 115, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-ID_1774541728063.webp" },
  { code: "WS", name: "WS", count: 23, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-WS_1774541733372.webp" },
  { code: "CQ9", name: "CQ9", count: 190, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-CQ9_1774541724286.webp" },
  { code: "KM", name: "KM", count: 32, icon: "https://images.23924894.com/prod-images/game_icon/default/bigImage/gcs__rng-km_1706608720510.webp" },
  { code: "R88", name: "R88", count: 77, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-R88_1774541730428.webp" },
  { code: "MW", name: "MW", count: 66, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-MW_1774541729214.webp" },
  { code: "RG", name: "RG", count: 21, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-RG_1774541731397.webp" },
  { code: "2J", name: "2J", count: 56, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-2J_1774541715328.webp" },
  { code: "SWG", name: "SWG", count: 30, icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-SWG_1774541732305.webp" },
];

const vendorLogoBase = "https://images.23924894.com/TCG_PROD_IMAGES/RNG_LIST_VENDOR";

function SlotsPage() {
  const [query, setQuery] = useState("");
  const totalGames = useMemo(() => rngProviders.reduce((s, p) => s + p.count, 0), []);
  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return rngProviders;
    return rngProviders.filter((p) => p.name.toUpperCase().includes(q) || p.code.toUpperCase().includes(q));
  }, [query]);

  return (
    <SiteShell>
      <h1 className="sr-only">স্লট গেমস</h1>
      <section
        className="game-lobby RNG"
        aria-label="Slot providers"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(255,220,120,0.18), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(255,220,120,0.14), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        <div className="mx-auto mb-6 flex w-[1200px] max-w-[calc(100vw-96px)] flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(180deg,#0f5a34,#083f22)] px-4 py-2 ring-1 ring-[var(--neon-green)]/50">
            <Gamepad2 className="h-5 w-5 text-[var(--neon-gold)]" />
            <h2 className="text-base font-bold tracking-wide text-[var(--neon-gold)]">স্লট প্রোভাইডার</h2>
            <span className="ml-2 rounded-full bg-black/40 px-2 py-0.5 text-xs font-bold text-white">
              {rngProviders.length} প্রোভাইডার · {totalGames.toLocaleString("bn-BD")} গেম
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
      aria-label={`${p.name} slot games`}
      style={{ animationDelay: `${Math.min(index * 25, 800)}ms`, animationFillMode: "backwards" }}
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
        {/* Game count badge */}
        <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-black text-[var(--neon-gold)] ring-1 ring-[var(--neon-gold)]/50 backdrop-blur">
          {p.count}
        </span>
        {/* Gold ring on hover */}
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-0 ring-[var(--neon-gold)] transition-all duration-300 group-hover:ring-2 group-hover:shadow-[0_10px_28px_rgba(255,215,80,0.35)]" />
      </div>
    </button>
  );
}


