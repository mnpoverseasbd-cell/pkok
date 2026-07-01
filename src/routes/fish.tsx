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
            <button key={p.code} className="lobby-item" aria-label={`${p.name} fish games`}>
              <img src={p.icon} alt="" loading="lazy" className="game-img" />
              <img
                src={`https://images.23924894.com/TCG_PROD_IMAGES/RNG_LIST_VENDOR/${p.code}-WHITE.png`}
                alt={p.name}
                loading="lazy"
                className="vendor-img"
              />
            </button>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
