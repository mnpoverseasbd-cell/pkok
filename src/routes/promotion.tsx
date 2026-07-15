import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Gift, Sparkles } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";

export const Route = createFileRoute("/promotion")({
  head: () => ({
    meta: [
      { title: "প্রমোশন — PKOK" },
      { name: "description", content: "PKOK এর সমস্ত চলমান প্রমোশন, বোনাস, ওয়েলকাম অফার, ক্যাশব্যাক ও স্পেশাল ইভেন্ট এক জায়গায়।" },
      { property: "og:title", content: "প্রমোশন — PKOK" },
      { property: "og:description", content: "ওয়েলকাম বোনাস, ডেইলি রিওয়ার্ড, VIP ক্যাশব্যাক এবং বিশেষ ইভেন্ট প্রমোশন।" },
    ],
  }),
  component: PromotionPage,
});

type Cat = "all" | "new" | "deposit" | "slot" | "fishing" | "live" | "poker" | "sports";

const tabs: { key: Cat; label: string }[] = [
  { key: "all", label: "সকল" },
  { key: "new", label: "নতুন" },
  { key: "deposit", label: "ডিপোজিট" },
  { key: "slot", label: "স্লট" },
  { key: "fishing", label: "ফিশিং" },
  { key: "live", label: "লাইভ" },
  { key: "poker", label: "পোকার" },
  { key: "sports", label: "স্পোর্টস" },
];

const B = "https://images.23924894.com/mcs-images/announcement/pkokbdtf6/";

const promos: { img: string; title: string; cats: Cat[] }[] = [
  { img: B + "3013088_1747311939545.png", title: "95OK.COM এ আপনাকে করছি ঠিক স্বাগত", cats: ["new"] },
  { img: B + "3013088_1747298518814.png", title: "১ জন বন্ধুকে আমন্ত্রণ জানিয়ে ১৭৭৭ টাকা রিবেট নিন", cats: ["new"] },
  { img: B + "3013088_1747144665094.png", title: "প্রতিদিন লগইন করুন গেম খেলে এবং জিতুন ৭,৭৭৭ টাকা", cats: ["new"] },
  { img: B + "3013088_1747144146761.png", title: "দৈনিক চ্যাম্পিয়নশিপ, পুরস্কার তহবিল ১০,০০,০০০ টাকা", cats: ["slot"] },
  { img: B + "3013088_1749471837701.png", title: "প্রথম ডিপোজিটে উপভোগ করুন ৫০% বোনাস", cats: ["deposit", "new"] },
  { img: B + "3013088_1747311702409.png", title: "নতুন সদস্যদের জন্য দ্বিতীয় উপহার — ১০% বোনাস", cats: ["deposit"] },
  { img: B + "3026578_1781775033023.gif", title: "সাইন আপ করলেই পাচ্ছেন ১৭ টাকা, উত্তোলন ৩০০ টাকা", cats: ["new"] },
  { img: B + "3013088_1747224285019.png", title: "VIP আপগ্রেড বোনাস — সাপ্তাহিক ও মাসিক পুরস্কার", cats: ["new"] },
  { img: B + "3013088_1747363901849.png", title: "নতুন সদস্য বৃদ্ধির পরিকল্পনা (৩০ দিন)", cats: ["new"] },
  { img: B + "3013088_1747279238523.png", title: "দৈনিক লগইন লাকি পুরস্কার — সর্বমোট ১০,০০,০০০ টাকা", cats: ["slot"] },
  { img: B + "3013088_1747224576361.png", title: "স্লট গেমে লস রিলিফ বোনাস ৩০% পর্যন্ত", cats: ["slot"] },
  { img: B + "3013088_1747314206375.png", title: "প্রতিদিনের রিয়েল-টাইম বেটিং রিবেট সর্বোচ্চ ৫% পর্যন্ত", cats: ["live"] },
  { img: B + "3013088_1747278645988.png", title: "রহস্যময় বোনাস ও লাকি বোনাস — সর্বোচ্চ ১১১,১১১ টাকা", cats: ["new"] },
  { img: B + "3013088_1747223721487.png", title: "সদস্য দিবস কার্নিভাল ৭, ১৭, ২৭ — ১০০ কোটি পুরস্কার", cats: ["new"] },
  { img: B + "3013088_1747312982654.png", title: "অ্যাপ ডাউনলোড করলে বোনাস ২৭ টাকা", cats: ["new"] },
  { img: B + "3003251_1776240520734.gif", title: "TG অফিসিয়াল চ্যানেল ফলো করুন, জিতুন ১১,৭৭৭ টাকা", cats: ["new"] },
  { img: B + "3013088_1747197386612.png", title: "PKOK সদস্যদের জন্মদিন বোনাস", cats: ["new"] },
  { img: B + "3013088_1747198794639.png", title: "ডিপোজিট এর নির্দেশাবলী", cats: ["deposit"] },
  { img: B + "3003251_1747025134589.png", title: "অফার নিয়ম এবং শর্তাবলী", cats: ["new"] },
  { img: B + "3013088_1747364441025.png", title: "১.১.১.১ অ্যাপ ডাউনলোড করুন", cats: ["new"] },
  { img: B + "3013088_1747198975346.png", title: "লেটেস্ট সহযোগিতা PJOK", cats: ["slot"] },
  { img: B + "3003251_1776241545201.gif", title: "লেটেস্ট সহযোগিতা BDOK", cats: ["slot"] },
  { img: B + "3003251_1776162225132.gif", title: "লেটেস্ট সহযোগিতা NNOK", cats: ["slot"] },
  { img: B + "3003251_1776241336331.gif", title: "লেটেস্ট সহযোগিতা 333OK", cats: ["slot"] },
];

function PromotionPage() {
  const [active, setActive] = useState<Cat>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const m: Record<Cat, number> = { all: promos.length, new: 0, deposit: 0, slot: 0, fishing: 0, live: 0, poker: 0, sports: 0 };
    for (const p of promos) for (const c of p.cats) if (c in m) m[c]++;
    return m;
  }, []);

  const visible = useMemo(() => {
    const base = active === "all" ? promos : promos.filter((p) => p.cats.includes(active));
    const q = query.trim().toLowerCase();
    return q ? base.filter((p) => p.title.toLowerCase().includes(q)) : base;
  }, [active, query]);

  return (
    <SiteShell>
      {/* Hero strip */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(255,220,120,0.22), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(120,255,180,0.16), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 60%, #062e19 100%)",
        }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 ring-1 ring-[var(--neon-gold)]/60">
              <Gift className="h-5 w-5 text-[var(--neon-gold)]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[var(--neon-gold)] drop-shadow-[0_2px_10px_rgba(255,215,80,0.35)]">
                সকল প্রমোশন
              </h1>
              <p className="text-xs text-white/70">
                <Sparkles className="mr-1 inline h-3 w-3 text-[var(--neon-gold)]" />
                {promos.length}টি চলমান অফার · প্রতিদিন আপডেট
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 ring-1 ring-black/10">
            <Search className="h-4 w-4 text-black/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="প্রমোশন খুঁজুন..."
              className="w-40 border-none bg-transparent text-sm text-black placeholder:text-black/40 focus:outline-none sm:w-64"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 pt-4 sm:px-4 lg:px-6">
        <div className="flex justify-center gap-1 overflow-x-auto pb-2">
          {tabs.map((t) => {
            const on = active === t.key;
            const n = counts[t.key] ?? 0;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`shrink-0 px-4 py-2 text-sm font-bold transition-colors ${
                  on
                    ? "text-[var(--neon-gold)] border-b-2 border-[var(--neon-gold)]"
                    : "text-white/75 hover:text-white border-b-2 border-transparent"
                }`}
              >
                {t.label}
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${on ? "bg-[var(--neon-gold)]/20 text-[var(--neon-gold)]" : "bg-white/10 text-white/60"}`}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-3 py-6 sm:px-4">
        {visible.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/70">কোন প্রমোশন পাওয়া যায়নি</div>
        ) : (
          <div key={active + query} className="grid gap-4 sm:grid-cols-2">
            {visible.map((p, i) => (
              <article
                key={p.title + i}
                style={{
                  animationDelay: `${Math.min(i * 60, 800)}ms`,
                  animationFillMode: "backwards",
                }}
                className="promo-card group relative overflow-hidden rounded-xl border border-[var(--neon-green)]/50 bg-black/30 animate-fade-in transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(57,255,20,0.45)] hover:border-[var(--neon-gold)]"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.title}
                    loading="lazy"
                    className="block w-full h-auto transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute inset-0 promo-shimmer" aria-hidden />
                  {p.cats.includes("new") && (
                    <span className="absolute left-2 top-2 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-black text-white ring-1 ring-white/40 backdrop-blur">
                      HOT
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2 bg-black/50 backdrop-blur">
                  <h3 className="text-xs font-semibold text-foreground/90 truncate">{p.title}</h3>
                  <button className="shrink-0 rounded-md bg-green-button px-4 py-1 text-[11px] font-black text-[var(--background)] transition hover:brightness-110 hover:scale-105 active:scale-95">
                    আরও
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
