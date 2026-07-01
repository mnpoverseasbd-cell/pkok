import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/landing/SiteShell";
import b01 from "@/assets/promo/b01.jpg";
import b02 from "@/assets/promo/b02.jpg";
import b03 from "@/assets/promo/b03.jpg";
import b04 from "@/assets/promo/b04.jpg";
import b05 from "@/assets/promo/b05.jpg";
import b06 from "@/assets/promo/b06.jpg";
import b07 from "@/assets/promo/b07.jpg";
import b08 from "@/assets/promo/b08.jpg";
import b09 from "@/assets/promo/b09.jpg";
import b10 from "@/assets/promo/b10.jpg";
import b11 from "@/assets/promo/b11.jpg";
import b12 from "@/assets/promo/b12.jpg";
import b13 from "@/assets/promo/b13.jpg";
import b14 from "@/assets/promo/b14.jpg";
import b15 from "@/assets/promo/b15.jpg";
import b16 from "@/assets/promo/b16.jpg";
import b17 from "@/assets/promo/b17.jpg";
import b18 from "@/assets/promo/b18.jpg";
import b19 from "@/assets/promo/b19.jpg";
import b20 from "@/assets/promo/b20.jpg";
import b21 from "@/assets/promo/b21.jpg";
import b22 from "@/assets/promo/b22.jpg";
import b23 from "@/assets/promo/b23.jpg";
import b24 from "@/assets/promo/b24.jpg";

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

const promos: { img: string; title: string; cats: Cat[] }[] = [
  { img: b01, title: "95OK.COM এ আপনাকে করছি ঠিক স্বাগত", cats: ["new"] },
  { img: b02, title: "১ জন বন্ধুকে আমন্ত্রণ জানিয়ে ১৭৭৭ টাকা রিবেট নিন", cats: ["new"] },
  { img: b03, title: "প্রতিদিন লগইন করুন গেম খেলে এবং জিতুন ৭,৭৭৭ টাকা", cats: ["new"] },
  { img: b04, title: "দৈনিক চ্যাম্পিয়নশিপ, পুরস্কার তহবিল ১০,০০,০০০ টাকা", cats: ["slot"] },
  { img: b05, title: "প্রথম ডিপোজিটে উপভোগ করুন ৫০% বোনাস", cats: ["deposit", "new"] },
  { img: b06, title: "নতুন সদস্যদের জন্য দ্বিতীয় উপহার — ১০% বোনাস", cats: ["deposit"] },
  { img: b07, title: "সাইন আপ করলেই পাচ্ছেন ১৭ টাকা, উত্তোলন ৩০০ টাকা", cats: ["new"] },
  { img: b08, title: "VIP আপগ্রেড বোনাস — সাপ্তাহিক ও মাসিক পুরস্কার", cats: ["new"] },
  { img: b09, title: "নতুন সদস্য বৃদ্ধির পরিকল্পনা (৩০ দিন)", cats: ["new"] },
  { img: b10, title: "দৈনিক লগইন লাকি পুরস্কার — সর্বমোট ১০,০০,০০০ টাকা", cats: ["slot"] },
  { img: b11, title: "স্লট গেমে লস রিলিফ বোনাস ৩০% পর্যন্ত", cats: ["slot"] },
  { img: b12, title: "প্রতিদিনের রিয়েল-টাইম বেটিং রিবেট সর্বোচ্চ ৫% পর্যন্ত", cats: ["live"] },
  { img: b13, title: "রহস্যময় বোনাস ও লাকি বোনাস — সর্বোচ্চ ১১১,১১১ টাকা", cats: ["new"] },
  { img: b14, title: "সদস্য দিবস কার্নিভাল ৭, ১৭, ২৭ — ১০০ কোটি পুরস্কার", cats: ["new"] },
  { img: b15, title: "অ্যাপ ডাউনলোড করলে বোনাস ২৭ টাকা", cats: ["new"] },
  { img: b16, title: "TG অফিসিয়াল চ্যানেল ফলো করুন, জিতুন ১১,৭৭৭ টাকা", cats: ["new"] },
  { img: b17, title: "PKOK সদস্যদের জন্মদিন বোনাস", cats: ["new"] },
  { img: b18, title: "ডিপোজিট এর নির্দেশাবলী", cats: ["deposit"] },
  { img: b19, title: "অফার নিয়ম এবং শর্তাবলী", cats: ["new"] },
  { img: b20, title: "১.১.১.১ অ্যাপ ডাউনলোড করুন", cats: ["new"] },
  { img: b21, title: "লেটেস্ট সহযোগিতা PJOK", cats: ["slot"] },
  { img: b22, title: "লেটেস্ট সহযোগিতা BDOK", cats: ["slot"] },
  { img: b23, title: "লেটেস্ট সহযোগিতা NNOK", cats: ["slot"] },
  { img: b24, title: "লেটেস্ট সহযোগিতা 333OK", cats: ["slot"] },
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
              style={{ animationDelay: `${Math.min(i, 8) * 70}ms`, animationFillMode: "both" }}
              className="group relative overflow-hidden rounded-xl border border-[var(--neon-green)]/50 bg-black/30 opacity-0 animate-[fade-in_0.5s_ease-out_forwards] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--neon-gold)] hover:shadow-[0_0_28px_rgba(255,200,60,0.45)]"
            >
              <div className="relative overflow-hidden">
                <img
                  src={p.img}
                  alt={p.title}
                  loading="lazy"
                  className="block w-full h-auto transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 group-hover:translate-x-full transition-transform duration-[900ms] ease-out" />
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2 bg-black/40">
                <h3 className="text-xs font-semibold text-foreground/90 truncate">{p.title}</h3>
                <button className="shrink-0 rounded-md bg-green-button px-4 py-1 text-[11px] font-black text-[var(--background)] transition-transform hover:brightness-110 hover:scale-105 active:scale-95">
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
