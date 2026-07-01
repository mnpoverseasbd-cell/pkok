import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/landing/SiteShell";
import sportsTile from "@/assets/sports-tile.jpg";

export const Route = createFileRoute("/sports")({
  head: () => ({
    meta: [
      { title: "স্পোর্টস বেটিং — Asik Game" },
      { name: "description", content: "BTI, SBOBET, SABA, IMSB, CMD সহ শীর্ষ স্পোর্টস বুক প্রোভাইডার — লাইভ ক্রিকেট, ফুটবল, টেনিস।" },
      { property: "og:title", content: "স্পোর্টস বেটিং — Asik Game" },
      { property: "og:description", content: "লাইভ স্পোর্টস বেটিং — সেরা প্রোভাইডার এক জায়গায়।" },
    ],
  }),
  component: SportsPage,
});

type Provider = { code: string; name: string };

// Sports vendors verified on the CDN (SPORTS_LIST_VENDOR)
const sportsProviders: Provider[] = [
  { code: "BTI",  name: "BTI Sports" },
  { code: "SB",   name: "SBO Sports" },
  { code: "SBO",  name: "SBOBET" },
  { code: "SABA", name: "SABA Sports" },
  { code: "IMSB", name: "IM Sports" },
  { code: "CMD",  name: "CMD368" },
  { code: "UG",   name: "UG Sports" },
  { code: "UG2",  name: "UG2 Sports" },
  { code: "CR",   name: "CR Sports" },
  { code: "TF",   name: "TF Gaming" },
  { code: "PIN",  name: "Pinnacle" },
];

const vendorLogoBase = "https://images.23924894.com/TCG_PROD_IMAGES/SPORTS_LIST_VENDOR";

function SportsPage() {
  return (
    <SiteShell footer={false}>
      <h1 className="sr-only">স্পোর্টস বেটিং</h1>
      <section className="game-lobby SPORT" aria-label="Sports providers">
        <div className="game-list">
          {sportsProviders.map((p) => (
            <ProviderCard key={p.code} p={p} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

function ProviderCard({ p }: { p: Provider }) {
  return (
    <button className="lobby-item" aria-label={`${p.name} sports betting`}>
      <img src={sportsTile} alt="" loading="lazy" className="game-img" />
      <img src={`${vendorLogoBase}/${p.code}-WHITE.png`} alt={p.name} loading="lazy" className="vendor-img" />
    </button>
  );
}
