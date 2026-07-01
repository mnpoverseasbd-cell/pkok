import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/landing/SiteShell";
import pokerTile from "@/assets/poker-tile.jpg";

export const Route = createFileRoute("/poker")({
  head: () => ({
    meta: [
      { title: "পোকার ও PVP গেমস — Asik Game" },
      { name: "description", content: "KingMaker, JDB, JILI, KY, Rich Gaming, V8Poker সহ প্রিমিয়াম PVP পোকার প্রোভাইডার।" },
      { property: "og:title", content: "পোকার ও PVP গেমস — Asik Game" },
      { property: "og:description", content: "Texas Holdem থেকে Video Poker — সব PVP প্রোভাইডার এক জায়গায়।" },
    ],
  }),
  component: PokerPage,
});

type Provider = { code: string; name: string };

const pvpProviders: Provider[] = [
  { code: "KM",  name: "KingMaker" },
  { code: "JDB", name: "JDB Poker" },
  { code: "JL",  name: "JILI Poker" },
  { code: "KY",  name: "KY Gaming" },
  { code: "RG",  name: "Rich Gaming" },
  { code: "VG",  name: "V8 Poker" },
];

const vendorLogoBase = "https://images.23924894.com/TCG_PROD_IMAGES/PVP_LIST_VENDOR";

function PokerPage() {
  return (
    <SiteShell footer={false}>
      <h1 className="sr-only">পোকার ও PVP গেমস</h1>
      <section className="game-lobby PVP" aria-label="PVP poker providers">
        <div className="game-list">
          {pvpProviders.map((p) => (
            <ProviderCard key={p.code} p={p} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

function ProviderCard({ p }: { p: Provider }) {
  return (
    <button className="lobby-item" aria-label={`${p.name} poker`}>
      <img src={pokerTile} alt="" loading="lazy" className="game-img" />
      <img src={`${vendorLogoBase}/${p.code}-WHITE.png`} alt={p.name} loading="lazy" className="vendor-img" />
    </button>
  );
}
