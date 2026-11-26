import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Crown, Medal, Trophy, Loader2, TrendingUp } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { getWagerLeaderboard } from "@/lib/tournaments.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "লিডারবোর্ড — PKOK" },
      { name: "description", content: "সাপ্তাহিক ও মাসিক সেরা প্লেয়ারদের র‍্যাঙ্কিং।" },
      { property: "og:title", content: "লিডারবোর্ড — PKOK" },
      { property: "og:description", content: "সেরা প্লেয়ারদের র‍্যাঙ্কিং দেখুন।" },
    ],
  }),
  component: LeaderboardPage,
});

type Row = {
  rank: number;
  user_id: string;
  display_name: string | null;
  username: string | null;
  total_wager: number;
  total_bets: number;
  is_current_user: boolean;
};

function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getWagerLeaderboard({ data: { period: tab, limit: 50 } });
      setRows(r.rows as Row[]);
    } catch { setRows([]); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const me = user ? rows.find((r) => r.is_current_user) : null;

  return (
    <SiteShell>
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.12),transparent_55%),radial-gradient(circle_at_20%_100%,rgba(168,85,247,0.15),transparent_50%)]" />
      </div>

      <section className="mx-auto max-w-7xl px-3 pt-6 sm:px-4 lg:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-yellow-400/40 bg-gradient-to-br from-slate-950/80 to-violet-950/40 p-6 text-center backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(250,204,21,0.2),transparent_55%)]" />
          <div className="relative">
            <Trophy className="mx-auto h-10 w-10 text-yellow-300 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">লিডারবোর্ড</span>
            </h1>
            <p className="mt-2 text-sm text-white/70">সেরা প্লেয়ারদের র‍্যাঙ্কিং — বেশি বেট, বড় গৌরব।</p>
          </div>
        </div>

        <div className="mx-auto mt-5 inline-flex rounded-full border border-yellow-400/30 bg-slate-950/60 p-1 backdrop-blur">
          {(["daily", "weekly", "monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-1.5 text-sm font-bold transition ${
                tab === t
                  ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 shadow-[0_0_20px_rgba(250,204,21,0.5)]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {t === "daily" ? "আজ" : t === "weekly" ? "সাপ্তাহিক" : "মাসিক"}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-yellow-300" /></div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-10 text-center text-white/60">
            <TrendingUp className="mx-auto mb-2 h-8 w-8 text-white/30" />
            এই সময়ে এখনও কোনো বেট নেই। প্রথম হয়ে টপে উঠুন!
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {podium.map((e) => {
                const gradient =
                  e.rank === 1 ? "from-yellow-400 to-amber-600" :
                  e.rank === 2 ? "from-slate-300 to-slate-500" :
                  "from-amber-600 to-amber-800";
                const border =
                  e.rank === 1 ? "border-yellow-400/70 shadow-[0_0_35px_rgba(250,204,21,0.35)]" :
                  e.rank === 2 ? "border-slate-300/60" :
                  "border-amber-500/60";
                const scale = e.rank === 1 ? "sm:scale-105" : "";
                const order = e.rank === 1 ? "sm:order-2" : e.rank === 2 ? "sm:order-1" : "sm:order-3";
                return (
                  <div key={e.rank} className={`relative overflow-hidden rounded-2xl border ${border} bg-slate-950/70 p-4 text-center backdrop-blur ${scale} ${order}`}>
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${gradient} opacity-10`} />
                    <div className="relative">
                      <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
                        <Crown className="h-8 w-8 text-white" />
                      </div>
                      <div className="mt-2 text-xs font-bold uppercase tracking-widest text-white/60">Rank #{e.rank}</div>
                      <div className="truncate text-lg font-black text-white">{e.display_name ?? e.username ?? "Player"}</div>
                      <div className="mt-2 text-xs text-white/60">মোট বেট</div>
                      <div className="text-lg font-black text-cyan-300">৳ {Number(e.total_wager).toLocaleString("en-BD")}</div>
                      <div className="mt-1 text-[10px] text-white/50">{e.total_bets} বেট</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur">
              <table className="w-full text-sm">
                <thead className="bg-black/40 text-xs uppercase text-white/50">
                  <tr>
                    <th className="px-4 py-3 text-left">র‍্যাঙ্ক</th>
                    <th className="px-4 py-3 text-left">প্লেয়ার</th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">বেট সংখ্যা</th>
                    <th className="px-4 py-3 text-right">মোট বেট</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((e) => {
                    const isMe = e.is_current_user;
                    return (
                      <tr key={e.user_id} className={`border-t border-white/5 ${isMe ? "bg-fuchsia-500/10" : ""}`}>
                        <td className="px-4 py-3 font-bold text-white/80">
                          <span className="inline-flex items-center gap-2">
                            <Medal className="h-4 w-4 text-white/40" />#{e.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-white/90">
                          {e.display_name ?? e.username ?? "Player"}
                          {isMe && <span className="ml-2 rounded-full bg-fuchsia-500/30 px-2 py-0.5 text-[10px] font-bold text-fuchsia-200">You</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-white/60 hidden sm:table-cell">{e.total_bets}</td>
                        <td className="px-4 py-3 text-right font-black text-cyan-300">৳ {Number(e.total_wager).toLocaleString("en-BD")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {user && !me && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-center text-sm text-white/70 backdrop-blur">
                এই সময়ের র‍্যাঙ্কিং-এ আপনি এখনও নেই — বেট করে টপ ৫০-এ ঢুকুন!
              </div>
            )}
          </>
        )}

        <p className="mt-3 text-center text-xs text-white/40">* র‍্যাঙ্কিং রিয়েল-টাইম বেট ভিত্তিক। রিফ্রেশ করলে আপডেট হবে।</p>
      </section>
    </SiteShell>
  );
}
