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

const liveProviders: Provider[] = [
  { code: "AIL",  name: "AI LIVE",     icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__LIVE-AIL_1751638721117.webp" },
  { code: "DG",   name: "DG",          icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__LIVE-DG_1774541710597.webp" },
  { code: "EG4",  name: "EG4",         icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__LIVE-EG4_1746086800324.png" },
  { code: "EZ",   name: "Ezugi",       icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__LIVE-EZ_1751638721662.webp" },
  { code: "GPI",  name: "GPI",         icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__LIVE-GPI_1751638721916.webp" },
  { code: "MG",   name: "Microgaming", icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__LIVE-MG_1751638724157.webp" },
  { code: "PP",   name: "Pragmatic Play", icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__LIVE-PP_1751638724696.webp" },
  { code: "PT",   name: "PlayTech",    icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__LIVE-PT_1747636424948.webp" },
  { code: "SA",   name: "SA Gaming",   icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__LIVE-SA_1751638724960.png" },
  { code: "SEX",  name: "Sexy Gaming", icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__LIVE-SEX_1751638725221.webp" },
  { code: "VIA",  name: "VIA",         icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__LIVE-VIA_1751638716880.webp" },
  { code: "WJ",   name: "WJ",          icon: "https://images.23924894.com/prod-images/game_icon/pkokbdtf6/bigImage/gcs__LIVE-WJ_1751638717134.webp" },
];

const vendorLogoBase = "https://images.23924894.com/TCG_PROD_IMAGES/LIVE_LIST_VENDOR";

function LivePage() {
  return (
    <SiteShell footer={false}>
      <h1 className="sr-only">লাইভ ক্যাসিনো</h1>
      <section className="game-lobby LIVE" aria-label="Live casino providers">
        <div className="game-list">
          {liveProviders.map((p) => (
            <ProviderCard key={p.code} p={p} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

function ProviderCard({ p }: { p: Provider }) {
  return (
    <button className="lobby-item" aria-label={`${p.name} live casino`}>
      <img src={p.icon} alt="" loading="lazy" className="game-img" />
      <img src={`${vendorLogoBase}/${p.code}-WHITE.png`} alt={p.name} loading="lazy" className="vendor-img" />
    </button>
  );
}
