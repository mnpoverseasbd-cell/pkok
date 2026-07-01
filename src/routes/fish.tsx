import { createFileRoute } from "@tanstack/react-router";
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

// Fish-list providers verified to exist on the CDN
const fishProviders: Provider[] = [
  { code: "JL",   name: "JILI",     icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-JL_1751638719376.webp" },
  { code: "FC",   name: "FC",       icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-FC_1751638718129.webp" },
  { code: "JDB",  name: "JDB",      icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-JDB_1751638718373.webp" },
  { code: "KA",   name: "KA",       icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-KA_1746086809247.webp" },
  { code: "CQ9",  name: "CQ9",      icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-CQ9_1774541724286.webp" },
  { code: "FS",   name: "FASTSPIN", icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-FS_1746086807531.webp" },
  { code: "SG",   name: "SG",       icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-SG_1746086813938.png" },
  { code: "MG",   name: "Microgaming", icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-MG_1751638719641.webp" },
  { code: "VA",   name: "Victory Ark", icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-VA_1746086814915.webp" },
  { code: "BSP",  name: "BSP",      icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-BSP_1746086805091.webp" },
  { code: "RSG",  name: "RSG",      icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-SG_1746086813938.png" },
  { code: "JK",   name: "Jokers",   icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-JK_1746086809008.webp" },
  { code: "BBIN", name: "BBIN",     icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-BBR_1774541721083.webp" },
  { code: "BB",   name: "BaiSheng", icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-BBR_1774541721083.webp" },
  { code: "TPG",  name: "TPG",      icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-TPG_1746086814664.webp" },
  { code: "NS",   name: "NS",       icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-NS_1751638719886.webp" },
  { code: "SWG",  name: "SWG",      icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-SWG_1774541732305.webp" },
  { code: "AMBS", name: "AMBS",     icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__RNG-AMBS_1746086803593.webp" },
];

const vendorLogoBase = "https://images.23924894.com/TCG_PROD_IMAGES/FISH_LIST_VENDOR";

function FishPage() {
  return (
    <SiteShell>
      <h1 className="sr-only">ফিশিং গেমস</h1>
      <section
        className="game-lobby FISH"
        aria-label="Fish providers"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(255,220,120,0.18), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(255,220,120,0.14), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        <div className="game-list" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
          {fishProviders.map((p) => (
            <ProviderCard key={p.code} p={p} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

function ProviderCard({ p }: { p: Provider }) {
  return (
    <button className="lobby-item" aria-label={`${p.name} fish games`}>
      <img src={p.icon} alt="" loading="lazy" className="game-img" />
      <img src={`${vendorLogoBase}/${p.code}-WHITE.png`} alt={p.name} loading="lazy" className="vendor-img" />
    </button>
  );
}
