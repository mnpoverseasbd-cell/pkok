import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/landing/SiteShell";
import welcome95 from "@/assets/promo/welcome95.jpg";
import deposit50 from "@/assets/promo/deposit50.jpg";
import deposit10 from "@/assets/promo/deposit10.jpg";
import dailyLogin from "@/assets/promo/daily-login.jpg";
import liveRebate from "@/assets/promo/live-rebate.jpg";
import slotTournament from "@/assets/promo/slot-tournament.jpg";
import sportsBoost from "@/assets/promo/sports-boost.jpg";
import fishingBonus from "@/assets/promo/fishing-bonus.jpg";
import pokerTournament from "@/assets/promo/poker-tournament.jpg";
import referFriend from "@/assets/promo/refer-friend.jpg";

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
  { img: welcome95, title: "95OK.COM এ ওয়েলকাম বোনাস", cats: ["new"] },
  { img: dailyLogin, title: "প্রতিদিন লগইন করলেই আকর্ষণীয় পুরস্কার", cats: ["new"] },
  { img: deposit50, title: "প্রথম ডিপোজিটে ৫০% বোনাস — সর্বোচ্চ ১০,০০০৳", cats: ["deposit", "new"] },
  { img: deposit10, title: "দ্বিতীয়বার জমায় ১০% বোনাস", cats: ["deposit"] },
  { img: slotTournament, title: "স্লট টুর্নামেন্ট — প্রাইজ পুল ১০ লাখ টাকা", cats: ["slot"] },
  { img: liveRebate, title: "লাইভ ক্যাসিনো ৫% আনলিমিটেড রিবেট", cats: ["live"] },
  { img: sportsBoost, title: "স্পোর্টস পার্লেতে ২০০% উইনিং বুস্ট", cats: ["sports"] },
  { img: fishingBonus, title: "ফিশিং গেমে দৈনিক ৩% বোনাস", cats: ["fishing"] },
  { img: pokerTournament, title: "সাপ্তাহিক পোকার টুর্নামেন্ট ৫ লাখ", cats: ["poker"] },
  { img: referFriend, title: "বন্ধুকে রেফার করে ৫০০৳ বোনাস", cats: ["new"] },
];

function PromotionPage() {
  const [active, setActive] = useState<Cat>("all");
  const visible = active === "all" ? promos : promos.filter((p) => p.cats.includes(active));

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pt-5 sm:px-4 lg:px-6">
        {/* Tabs */}
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

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
        <div key={active} className="grid gap-5 sm:grid-cols-2 animate-fade-in">
          {visible.map((p, i) => (
            <article
              key={p.title}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
              className="group overflow-hidden rounded-2xl border border-[var(--neon-green)]/40 panel-dark hover-scale animate-fade-in transition-shadow hover:shadow-[0_0_25px_rgba(57,255,20,0.35)]"
            >
              <div className="relative overflow-hidden">
                <img
                  src={p.img}
                  alt={p.title}
                  width={1024}
                  height={576}
                  loading="lazy"
                  className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <h3 className="text-sm font-bold text-foreground/90 line-clamp-1">{p.title}</h3>
                <button className="shrink-0 rounded-full bg-green-button px-5 py-2 text-xs font-black text-[var(--background)] transition hover:brightness-110">
                  আরও
                </button>
              </div>
            </article>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="py-20 text-center text-foreground/60">এই ক্যাটাগরিতে কোন প্রমোশন নেই</div>
        )}
      </section>
    </SiteShell>
  );
}
