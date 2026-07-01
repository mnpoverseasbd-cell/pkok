import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/landing/SiteShell";
import tcgImg from "@/assets/lott/tcg.jpg";
import tcgseaImg from "@/assets/lott/tcgsea.jpg";
import vrImg from "@/assets/lott/vr.jpg";
import gpiImg from "@/assets/lott/gpi.jpg";
import lottImg from "@/assets/lott/lott.jpg";

export const Route = createFileRoute("/lottery")({
  head: () => ({
    meta: [
      { title: "লটারি ও বিঙ্গো — Asik Game" },
      { name: "description", content: "TC Gaming, TCG SEA, VR, GPI সহ প্রিমিয়াম লটারি ও বিঙ্গো প্রোভাইডার।" },
      { property: "og:title", content: "লটারি ও বিঙ্গো — Asik Game" },
      { property: "og:description", content: "ভাগ্য পরীক্ষা করুন লটারি ও বিঙ্গো গেমসে।" },
    ],
  }),
  component: LotteryPage,
});

type Provider = { code: string; name: string; hero: string };

const lottProviders: Provider[] = [
  { code: "TCG",     name: "TC Gaming",  hero: tcgImg },
  { code: "TCG_SEA", name: "TCG SEA",    hero: tcgseaImg },
  { code: "VR",      name: "VR Lottery", hero: vrImg },
  { code: "GPI",     name: "GPI Keno",   hero: gpiImg },
  { code: "LOTT",    name: "Lucky Lott", hero: lottImg },
];

const vendorLogoBase = "https://images.23924894.com/TCG_PROD_IMAGES/ELOTT_LIST_VENDOR";

function LotteryPage() {
  return (
    <SiteShell footer={false}>
      <h1 className="sr-only">লটারি ও বিঙ্গো</h1>
      <section className="game-lobby ELOTT" aria-label="Lottery providers">
        <div className="game-list">
          {lottProviders.map((p) => (
            <ProviderCard key={p.code} p={p} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

function ProviderCard({ p }: { p: Provider }) {
  return (
    <button className="lobby-item" aria-label={`${p.name} lottery`}>
      <img src={p.hero} alt="" loading="lazy" className="game-img" />
      <img src={`${vendorLogoBase}/${p.code}-WHITE.png`} alt={p.name} loading="lazy" className="vendor-img" />
    </button>
  );
}
