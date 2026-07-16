import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Spade } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { ComingSoonBanner } from "@/components/landing/ComingSoonBanner";

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

const vendorLogoBase = "https://images.23924894.com/TCG_PROD_IMAGES/RNG_LIST_VENDOR";

function LivePage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return liveProviders;
    return liveProviders.filter((p) => p.name.toUpperCase().includes(q) || p.code.toUpperCase().includes(q));
  }, [query]);

  return (
    <SiteShell>
      <h1 className="sr-only">লাইভ ক্যাসিনো</h1>
      <div className="pt-4">
        <ComingSoonBanner
          title="লাইভ ক্যাসিনো শীঘ্রই চালু হচ্ছে"
          message="Evolution, Pragmatic Live, SA Gaming সহ live dealer provider এর real integration এখনো active নয়। বৈধ access পেলে এখানে চালু হবে।"
          providers={["Evolution", "Pragmatic Live", "SA Gaming", "Sexy", "Ezugi"]}
        />
      </div>
      <section
        className="game-lobby LIVE"
        aria-label="Live casino providers"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(255,90,120,0.18), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(255,220,120,0.14), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        <div className="mx-auto mb-6 flex w-[1200px] max-w-[calc(100vw-96px)] flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(180deg,#0f5a34,#083f22)] px-4 py-2 ring-1 ring-[var(--neon-green)]/50">
            <Spade className="h-5 w-5 text-[var(--neon-gold)]" />
            <h2 className="text-base font-bold tracking-wide text-[var(--neon-gold)]">লাইভ ক্যাসিনো প্রোভাইডার</h2>
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs font-bold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              LIVE · {liveProviders.length} প্রোভাইডার
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 ring-1 ring-black/10">
            <Search className="h-4 w-4 text-black/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="প্রোভাইডার খুঁজুন..."
              className="w-40 border-none bg-transparent text-sm text-black placeholder:text-black/40 focus:outline-none sm:w-56"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/70">কোন প্রোভাইডার পাওয়া যায়নি</div>
        ) : (
          <div className="game-list" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
            {filtered.map((p, i) => (
              <ProviderCard key={p.code} p={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function ProviderCard({ p, index }: { p: Provider; index: number }) {
  return (
    <button
      className="lobby-item group animate-fade-in"
      aria-label={`${p.name} live casino`}
      style={{ animationDelay: `${Math.min(index * 30, 600)}ms`, animationFillMode: "backwards" }}
    >
      <div className="relative w-full overflow-hidden rounded-lg">
        <img
          src={p.icon}
          alt=""
          loading="lazy"
          className="game-img transition-transform duration-500 group-hover:scale-110"
        />
        <img
          src={`${vendorLogoBase}/${p.code}-WHITE.png`}
          alt={p.name}
          loading="lazy"
          className="vendor-img transition-transform duration-300 group-hover:-translate-y-1"
        />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-black text-white ring-1 ring-white/40 backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          LIVE
        </span>
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-0 ring-[var(--neon-gold)] transition-all duration-300 group-hover:ring-2 group-hover:shadow-[0_10px_28px_rgba(255,215,80,0.35)]" />
      </div>
    </button>
  );
}
