import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/landing/SiteShell";
import pokerTile from "@/assets/poker-tile.jpg";
import bspLogo from "@/assets/providers/BSP.png.asset.json";
import kpLogo from "@/assets/providers/KP.png.asset.json";
import kmLogo from "@/assets/providers/KM.png.asset.json";
import r88Logo from "@/assets/providers/R88.png.asset.json";
import rgLogo from "@/assets/providers/RG.png.asset.json";
import sgLogo from "@/assets/providers/SG.png.asset.json";

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

type Provider = { code: string; name: string; logo: string };

const pvpProviders: Provider[] = [
  { code: "BSP", name: "Baison Games",  logo: bspLogo.url },
  { code: "KP",  name: "King's Poker",  logo: kpLogo.url },
  { code: "KM",  name: "KINGMIDAS",     logo: kmLogo.url },
  { code: "R88", name: "Rich88",        logo: r88Logo.url },
  { code: "RG",  name: "RG Rich Game",  logo: rgLogo.url },
  { code: "SG",  name: "SM Gaming",     logo: sgLogo.url },
];

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
      <img src={p.logo} alt={p.name} loading="lazy" className="vendor-img" />
    </button>
  );
}
