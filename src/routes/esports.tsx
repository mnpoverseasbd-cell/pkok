import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/landing/SiteShell";

export const Route = createFileRoute("/esports")({
  head: () => ({
    meta: [
      { title: "ই-স্পোর্টস — Asik Game" },
      { name: "description", content: "TF Gaming ও IA E-Sports সহ প্রিমিয়াম ই-স্পোর্টস প্রোভাইডার।" },
      { property: "og:title", content: "ই-স্পোর্টস — Asik Game" },
      { property: "og:description", content: "লাইভ ই-স্পোর্টস বেটিং।" },
    ],
  }),
  component: EsportsPage,
});

type Provider = { code: string; name: string; icon: string };

const B = "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/";

const esportsProviders: Provider[] = [
  { code: "TF", name: "TF Gaming",  icon: B + "gcs__SPORTS-TF_1751638716363.webp" },
  { code: "IA", name: "IA E-Sports", icon: B + "gcs__SPORTS-IA_1751638719114.webp" },
];

function EsportsPage() {
  return (
    <SiteShell>
      <h1 className="sr-only">ই-স্পোর্টস</h1>
      <section
        className="game-lobby ESPORT"
        aria-label="Esports providers"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(255,220,120,0.18), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(255,220,120,0.14), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        <div className="game-list" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
          {esportsProviders.map((p) => (
            <button key={p.code} className="lobby-item" aria-label={`${p.name} esports`}>
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
