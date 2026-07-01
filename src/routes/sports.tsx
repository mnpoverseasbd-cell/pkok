import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/landing/SiteShell";

export const Route = createFileRoute("/sports")({
  head: () => ({
    meta: [
      { title: "স্পোর্টস বেটিং — Asik Game" },
      { name: "description", content: "BTi, FB, Saba, SBO সহ শীর্ষ স্পোর্টস বুক প্রোভাইডার — লাইভ ক্রিকেট, ফুটবল, টেনিস।" },
      { property: "og:title", content: "স্পোর্টস বেটিং — Asik Game" },
      { property: "og:description", content: "লাইভ স্পোর্টস বেটিং — সেরা প্রোভাইডার এক জায়গায়।" },
    ],
  }),
  component: SportsPage,
});

type Provider = { code: string; name: string; icon: string };

const B = "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/";

const sportsProviders: Provider[] = [
  { code: "U9W",  name: "9Wickets",       icon: B + "gcs__SPORTS-U9W_1751638725486.webp" },
  { code: "LUC",  name: "Lucky Sports",   icon: B + "gcs__SPORTS-LUC_1751638714502.webp" },
  { code: "BTI",  name: "BTi",            icon: B + "gcs__SPORTS-BTI_1751638718621.webp" },
  { code: "FB",   name: "FB Sports",      icon: B + "gcs__SPORTS-FB_1751638718868.webp" },
  { code: "UG2",  name: "United Gaming",  icon: B + "gcs__SPORTS-UG2_1751638716634.webp" },
  { code: "PIN",  name: "AP Gaming",      icon: B + "gcs__SPORTS-PIN_1751638715080.webp" },
  { code: "POLY", name: "Poly Sports",    icon: B + "gcs__SPORTS-POLY_1751638715338.webp" },
  { code: "SV3",  name: "SV Ends",        icon: B + "gcs__SPORTS-SV3_1751638716086.webp" },
  { code: "RCB",  name: "Horse Racing",   icon: B + "gcs__SPORTS-RCB_1751638715580.webp" },
  { code: "SB",   name: "Saba Sports",    icon: B + "gcs__SPORTS-SB_1747547467925.webp" },
];

function SportsPage() {
  return (
    <SiteShell>
      <h1 className="sr-only">স্পোর্টস বেটিং</h1>
      <section
        className="game-lobby SPORT"
        aria-label="Sports providers"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(255,220,120,0.18), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(255,220,120,0.14), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        <div className="game-list" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
          {sportsProviders.map((p) => (
            <button key={p.code} className="lobby-item" aria-label={`${p.name} sports betting`}>
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
