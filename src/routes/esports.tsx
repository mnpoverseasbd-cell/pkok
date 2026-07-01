import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/landing/SiteShell";
import esportsTile from "@/assets/esports-tile.jpg";

export const Route = createFileRoute("/esports")({
  head: () => ({
    meta: [
      { title: "ই-স্পোর্টস — Asik Game" },
      { name: "description", content: "TF Gaming, IM Esports, CR Esports সহ প্রিমিয়াম ই-স্পোর্টস প্রোভাইডার — CS:GO, Dota 2, LoL, Valorant।" },
      { property: "og:title", content: "ই-স্পোর্টস — Asik Game" },
      { property: "og:description", content: "লাইভ ই-স্পোর্টস বেটিং।" },
    ],
  }),
  component: EsportsPage,
});

type Provider = { code: string; name: string };

// Esports vendors (verified on SPORTS_LIST_VENDOR CDN path)
const esportsProviders: Provider[] = [
  { code: "TF",   name: "TF Gaming" },
  { code: "IMSB", name: "IM Esports" },
  { code: "CR",   name: "CR Esports" },
  { code: "SABA", name: "SABA Esports" },
  { code: "UG",   name: "UG Esports" },
  { code: "PIN",  name: "Pinnacle Esports" },
];

const vendorLogoBase = "https://images.23924894.com/TCG_PROD_IMAGES/SPORTS_LIST_VENDOR";

function EsportsPage() {
  return (
    <SiteShell>
      <h1 className="sr-only">ই-স্পোর্টস</h1>
      <section className="game-lobby ESPORT" aria-label="Esports providers">
        <div className="game-list">
          {esportsProviders.map((p) => (
            <ProviderCard key={p.code} p={p} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

function ProviderCard({ p }: { p: Provider }) {
  return (
    <button className="lobby-item" aria-label={`${p.name} esports`}>
      <img src={esportsTile} alt="" loading="lazy" className="game-img" />
      <img src={`${vendorLogoBase}/${p.code}-WHITE.png`} alt={p.name} loading="lazy" className="vendor-img" />
    </button>
  );
}
