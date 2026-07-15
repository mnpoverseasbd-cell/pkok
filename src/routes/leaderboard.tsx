import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "লিডারবোর্ড — PKOK" },
      { name: "description", content: "সাপ্তাহিক ও মাসিক সেরা প্লেয়ারদের র‍্যাঙ্কিং, বিজয়ীদের প্রাইজ পুল।" },
      { property: "og:title", content: "লিডারবোর্ড — PKOK" },
      { property: "og:description", content: "সেরা প্লেয়ারদের র‍্যাঙ্কিং দেখুন।" },
    ],
  }),
  component: LeaderboardPage,
});

type Entry = { rank: number; name: string; wager: number; prize: number };

const weekly: Entry[] = [
  { rank: 1, name: "Rakib_Khan", wager: 1_245_000, prize: 50_000 },
  { rank: 2, name: "MegaBet_BD", wager: 980_500, prize: 30_000 },
  { rank: 3, name: "SlotKing77", wager: 812_300, prize: 20_000 },
  { rank: 4, name: "DhakaLion", wager: 645_200, prize: 12_000 },
  { rank: 5, name: "AviatorPro", wager: 512_800, prize: 8_000 },
  { rank: 6, name: "GoldFisher", wager: 430_450, prize: 6_000 },
  { rank: 7, name: "NeonJack", wager: 388_100, prize: 5_000 },
  { rank: 8, name: "CoxTiger", wager: 305_770, prize: 4_000 },
  { rank: 9, name: "ChittagongAce", wager: 271_400, prize: 3_000 },
  { rank: 10, name: "SylhetSpin", wager: 198_620, prize: 2_000 },
];

const monthly: Entry[] = weekly.map((e) => ({ ...e, wager: e.wager * 4.2, prize: e.prize * 5 }));

function LeaderboardPage() {
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");
  const rows = tab === "weekly" ? weekly : monthly;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pt-6 sm:px-4 lg:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--neon-gold)]/45 panel-dark p-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,214,54,0.22),transparent_55%)]" />
          <div className="relative">
            <Trophy className="mx-auto h-10 w-10 text-[var(--neon-gold)]" />
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              <span className="text-gradient-gold">লিডারবোর্ড</span>
            </h1>
            <p className="mt-2 text-sm text-foreground/80">সেরা প্লেয়ারদের র‍্যাঙ্কিং — বেশি বেট করুন, বেশি পুরস্কার জিতুন।</p>
          </div>
        </div>

        <div className="mx-auto mt-5 inline-flex rounded-full border border-white/10 bg-black/40 p-1">
          {(["weekly", "monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-1.5 text-sm font-bold transition ${
                tab === t ? "bg-gold-button text-[var(--background)]" : "text-white/70 hover:text-white"
              }`}
            >
              {t === "weekly" ? "সাপ্তাহিক" : "মাসিক"}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {podium.map((e) => {
            const color =
              e.rank === 1
                ? "from-yellow-400 to-amber-600 border-[var(--neon-gold)]"
                : e.rank === 2
                  ? "from-slate-300 to-slate-500 border-slate-300"
                  : "from-amber-600 to-amber-800 border-amber-500";
            return (
              <div key={e.rank} className={`rounded-2xl border bg-black/50 p-4 text-center ${color.split(" ").slice(-1)[0]}`}>
                <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${color.split(" ").slice(0, 2).join(" ")}`}>
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div className="mt-2 text-xs font-bold uppercase tracking-widest text-white/70">#{e.rank}</div>
                <div className="text-lg font-black text-white">{e.name}</div>
                <div className="mt-2 text-xs text-white/70">মোট বেট</div>
                <div className="text-sm font-bold text-[var(--neon-cyan)]">৳ {e.wager.toLocaleString("en-BD")}</div>
                <div className="mt-2 rounded-full bg-[var(--neon-green)]/15 py-1 text-sm font-black text-[var(--neon-green)]">প্রাইজ ৳ {e.prize.toLocaleString("en-BD")}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <table className="w-full text-sm">
            <thead className="bg-black/60 text-xs uppercase text-white/60">
              <tr>
                <th className="px-4 py-3 text-left">র‍্যাঙ্ক</th>
                <th className="px-4 py-3 text-left">প্লেয়ার</th>
                <th className="px-4 py-3 text-right">মোট বেট</th>
                <th className="px-4 py-3 text-right">প্রাইজ</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((e) => (
                <tr key={e.rank} className="border-t border-white/5 text-white/90">
                  <td className="px-4 py-3 font-bold">
                    <span className="inline-flex items-center gap-2">
                      <Medal className="h-4 w-4 text-white/50" />#{e.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{e.name}</td>
                  <td className="px-4 py-3 text-right text-[var(--neon-cyan)]">৳ {e.wager.toLocaleString("en-BD")}</td>
                  <td className="px-4 py-3 text-right font-black text-[var(--neon-green)]">৳ {e.prize.toLocaleString("en-BD")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-center text-xs text-white/50">* র‍্যাঙ্কিং প্রতি ঘণ্টায় আপডেট হয়। প্রাইজ পুল VIP লেভেলের উপর নির্ভর করে বাড়তে পারে।</p>
      </section>
    </SiteShell>
  );
}
