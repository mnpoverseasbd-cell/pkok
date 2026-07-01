import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  const visible = active === "all" ? promos : promos.filter((p) => p.cats.includes(active));

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pt-5 sm:px-4 lg:px-6">
        <div className="flex justify-center gap-1 overflow-x-auto pb-2">
          {tabs.map((t) => {
            const on = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`shrink-0 px-5 py-2 text-sm font-bold transition-colors ${
                  on
                    ? "text-[var(--neon-gold)] border-b-2 border-[var(--neon-gold)]"
                    : "text-white/75 hover:text-white border-b-2 border-transparent"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-3 py-6 sm:px-4">
        <div key={active} className="grid gap-4 sm:grid-cols-2">
          {visible.map((p, i) => (
            <article
              key={p.title + i}
              style={{
                animationDelay: `${i * 60}ms`,
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
      </section>
    </SiteShell>
  );
}
