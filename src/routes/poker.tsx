import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/landing/SiteShell";

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

type Provider = { code: string; name: string; icon: string };

const B = "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/";
const D = "https://images.23924894.com/prod-images/game_icon/default/bigImage/";

const pvpProviders: Provider[] = [
  { code: "BSP", name: "Baison Games", icon: B + "gcs__PVP-BSP_1751638717385.webp" },
  { code: "KP",  name: "King's Poker", icon: B + "gcs__PVP-KP_1751638717629.webp" },
  { code: "KM",  name: "KINGMIDAS",    icon: D + "gcs__pvp-km_1706608967801.avif" },
  { code: "R88", name: "Rich88",       icon: D + "gcs__pvp-r88_1754315236997.avif" },
  { code: "RG",  name: "RG Rich Game", icon: B + "gcs__PVP-RG_1774541712739.webp" },
  { code: "SWG", name: "SM Gaming",    icon: D + "gcs__pvp-swg_1706167637933.avif" },
];

function PokerPage() {
  return (
    <SiteShell>
      <h1 className="sr-only">পোকার ও PVP গেমস</h1>
      <section
        className="game-lobby PVP"
        aria-label="PVP poker providers"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(255,220,120,0.18), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(255,220,120,0.14), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        <div className="game-list" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
          {pvpProviders.map((p) => (
            <button key={p.code} className="lobby-item" aria-label={`${p.name} poker`}>
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
