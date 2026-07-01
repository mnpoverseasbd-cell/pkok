import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/landing/SiteShell";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "লাইভ ক্যাসিনো — Asik Game" },
      { name: "description", content: "Evolution, Pragmatic, SA সহ শীর্ষ লাইভ ক্যাসিনো প্রোভাইডার এক জায়গায়।" },
      { property: "og:title", content: "লাইভ ক্যাসিনো — Asik Game" },
      { property: "og:description", content: "রিয়েল ডিলার সহ প্রিমিয়াম লাইভ ক্যাসিনো।" },
    ],
  }),
  component: LivePage,
});

type Provider = { code: string; name: string; icon: string };

const B = "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/";

const liveProviders: Provider[] = [
  { code: "EG4", name: "Evolution",       icon: B + "gcs__LIVE-EG4_1746086800324.png" },
  { code: "PP",  name: "Pragmatic Play",  icon: B + "gcs__LIVE-PP_1751638724696.webp" },
  { code: "SEX", name: "Sexy",            icon: B + "gcs__LIVE-SEX_1751638725221.webp" },
  { code: "EZ",  name: "Ezugi",           icon: B + "gcs__LIVE-EZ_1751638721662.webp" },
  { code: "MG",  name: "Microgaming",     icon: B + "gcs__LIVE-MG_1751638724157.webp" },
  { code: "GPI", name: "GamePlay",        icon: B + "gcs__LIVE-GPI_1751638721916.webp" },
  { code: "VIA", name: "VIA Casino",      icon: B + "gcs__LIVE-VIA_1751638716880.webp" },
  { code: "WJ",  name: "W Casino",        icon: B + "gcs__LIVE-WJ_1751638717134.webp" },
  { code: "AIL", name: "AI Live Casino",  icon: B + "gcs__LIVE-AIL_1751638721117.webp" },
  { code: "SA",  name: "SA Gaming",       icon: B + "gcs__LIVE-SA_1751638724960.png" },
  { code: "PT",  name: "PlayTech",        icon: B + "gcs__LIVE-PT_1747636424948.webp" },
  { code: "DG",  name: "DreamGaming",     icon: B + "gcs__LIVE-DG_1774541710597.webp" },
];

function LivePage() {
  return (
    <SiteShell>
      <h1 className="sr-only">লাইভ ক্যাসিনো</h1>
      <section
        className="game-lobby LIVE"
        aria-label="Live casino providers"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(255,220,120,0.18), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(255,220,120,0.14), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        <div className="game-list" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
          {liveProviders.map((p) => (
            <button key={p.code} className="lobby-item" aria-label={`${p.name} live casino`}>
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
