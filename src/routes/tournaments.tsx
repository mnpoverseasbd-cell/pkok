import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { CalendarClock, Coins, Flame, Trophy, Users, Loader2, Crown, Medal, Gamepad2 } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { joinTournament, getTournamentLeaderboard } from "@/lib/tournaments.functions";

export const Route = createFileRoute("/tournaments")({
  head: () => ({
    meta: [
      { title: "টুর্নামেন্ট — PKOK" },
      { name: "description", content: "লাইভ ও আসন্ন টুর্নামেন্ট — বড় প্রাইজ পুলে অংশ নিন।" },
      { property: "og:title", content: "টুর্নামেন্ট — PKOK" },
      { property: "og:description", content: "লাইভ ও আসন্ন টুর্নামেন্টে অংশ নিন।" },
    ],
  }),
  component: TournamentsPage,
});

type Tournament = {
  id: string;
  name: string;
  description: string | null;
  game_id: string | null;
  starts_at: string;
  ends_at: string;
  prize_pool: number;
  prize_distribution: number[];
  min_bet: number;
  capacity: number | null;
  is_active: boolean;
  finalized_at: string | null;
};

type LB = { rank: number; user_id: string; display_name: string | null; username: string | null; total_wager: number; total_bets: number; prize: number };

const H = 3600_000, D = 86400_000;

function statusOf(t: Tournament): "live" | "upcoming" | "ended" {
  const now = Date.now();
  const s = new Date(t.starts_at).getTime();
  const e = new Date(t.ends_at).getTime();
  if (t.finalized_at || now > e || !t.is_active) return "ended";
  if (now < s) return "upcoming";
  return "live";
}

function Countdown({ to }: { to: number }) {
  const [t, setT] = useState(to - Date.now());
  useEffect(() => {
    const i = setInterval(() => setT(to - Date.now()), 1000);
    return () => clearInterval(i);
  }, [to]);
  if (t <= 0) return <span className="text-white/60">শেষ</span>;
  const d = Math.floor(t / D), h = Math.floor((t % D) / H);
  const m = Math.floor((t % H) / 60_000), s = Math.floor((t % 60_000) / 1000);
  return (
    <span className="font-mono font-bold text-fuchsia-300">
      {d > 0 ? `${d}d ` : ""}{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

function CosmicCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-slate-950/80 to-violet-950/40 p-5 backdrop-blur ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.15),transparent_60%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function TournamentsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"live" | "upcoming" | "ended">("live");
  const [items, setItems] = useState<Tournament[]>([]);
  const [entries, setEntries] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [openLB, setOpenLB] = useState<string | null>(null);
  const [lbData, setLbData] = useState<Record<string, LB[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("tournaments").select("*").order("starts_at", { ascending: false }).limit(200);
    setItems((data as Tournament[]) ?? []);
    if (user) {
      const { data: e } = await supabase.from("tournament_entries").select("tournament_id").eq("user_id", user.id);
      const map: Record<string, boolean> = {};
      (e ?? []).forEach((r: any) => { map[r.tournament_id] = true; });
      setEntries(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => items.filter((i) => statusOf(i) === tab), [items, tab]);

  const handleJoin = async (t: Tournament) => {
    if (!user) { toast.error("প্রথমে লগইন করুন"); return; }
    setJoining(t.id);
    try {
      await joinTournament({ data: { tournamentId: t.id } });
      toast.success(`${t.name} — যোগদান সফল! এবার বেট করে র‍্যাঙ্ক তুলুন।`);
      setEntries((p) => ({ ...p, [t.id]: true }));
    } catch (e: any) {
      toast.error(e?.message ?? "যোগদান ব্যর্থ");
    } finally { setJoining(null); }
  };

  const toggleLB = async (t: Tournament) => {
    if (openLB === t.id) { setOpenLB(null); return; }
    setOpenLB(t.id);
    if (!lbData[t.id]) {
      try {
        const r = await getTournamentLeaderboard({ data: { tournamentId: t.id, limit: 20 } });
        setLbData((p) => ({ ...p, [t.id]: r.rows as LB[] }));
      } catch { /* ignore */ }
    }
  };

  return (
    <SiteShell>
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.15),transparent_50%),radial-gradient(circle_at_80%_90%,rgba(236,72,153,0.12),transparent_50%)]" />
      </div>

      <section className="mx-auto max-w-7xl px-3 pt-6 sm:px-4 lg:px-6">
        <CosmicCard className="text-center">
          <Trophy className="mx-auto h-10 w-10 text-fuchsia-400" />
          <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
            <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">টুর্নামেন্ট</span> সেন্টার
          </h1>
          <p className="mt-2 text-sm text-white/70">লাইভ প্রাইজ পুল — বেশি বেট করুন, বেশি জিতুন। প্রতিটি ফিনালাইজেশনে টপ র‍্যাঙ্কের ওয়ালেটে অটো পেআউট।</p>
        </CosmicCard>

        <div className="mx-auto mt-5 inline-flex rounded-full border border-violet-500/30 bg-slate-950/60 p-1 backdrop-blur">
          {(["live", "upcoming", "ended"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-1.5 text-sm font-bold capitalize transition ${
                tab === t
                  ? "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {t === "live" ? "🔥 লাইভ" : t === "upcoming" ? "⏳ আসন্ন" : "🏁 শেষ"}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" /></div>
        ) : filtered.length === 0 ? (
          <CosmicCard className="text-center text-white/70">এই ক্যাটাগরিতে কোনো টুর্নামেন্ট নেই।</CosmicCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const st = statusOf(t);
              const isLive = st === "live";
              const isEnded = st === "ended";
              const joined = !!entries[t.id];
              const endTs = new Date(t.ends_at).getTime();
              const startTs = new Date(t.starts_at).getTime();
              const dist = Array.isArray(t.prize_distribution) ? t.prize_distribution : [];

              return (
                <CosmicCard key={t.id} className="transition hover:border-fuchsia-400/60 hover:shadow-[0_0_30px_rgba(217,70,239,0.3)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-violet-200">
                        <Gamepad2 className="h-3 w-3" /> {t.game_id ?? "সব গেম"}
                      </div>
                      <h3 className="mt-2 truncate text-lg font-black text-white">{t.name}</h3>
                      {t.description && <p className="mt-1 line-clamp-2 text-xs text-white/60">{t.description}</p>}
                    </div>
                    {isLive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                        <Flame className="h-3 w-3" /> LIVE
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/80">
                    <div className="rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/5 p-2">
                      <div className="flex items-center gap-1 text-white/60"><Coins className="h-3 w-3" /> প্রাইজ পুল</div>
                      <div className="mt-0.5 text-base font-black text-fuchsia-300">৳ {Number(t.prize_pool).toLocaleString("en-BD")}</div>
                    </div>
                    <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 p-2">
                      <div className="flex items-center gap-1 text-white/60"><CalendarClock className="h-3 w-3" /> {isEnded ? "শেষ" : isLive ? "শেষ হবে" : "শুরু"}</div>
                      <div className="mt-0.5">
                        {isEnded ? <span className="font-bold text-white/60">সমাপ্ত</span> : <Countdown to={isLive ? endTs : startTs} />}
                      </div>
                    </div>
                  </div>

                  {dist.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {dist.slice(0, 5).map((pct, i) => (
                        <span key={i} className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-white/80">
                          #{i + 1} <span className="font-bold text-fuchsia-300">{pct}%</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> Min bet ৳{t.min_bet}</span>
                    {joined && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Joined</span>}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      disabled={isEnded || joining === t.id}
                      onClick={() => handleJoin(t)}
                      className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 py-2 text-sm font-black text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] disabled:opacity-50"
                    >
                      {joining === t.id ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : isEnded ? "সমাপ্ত" : joined ? "যোগ দিয়েছেন" : isLive ? "এখনই যোগ দিন" : "প্রি-এনরোল"}
                    </button>
                    <button
                      onClick={() => toggleLB(t)}
                      className="rounded-full border border-violet-500/40 bg-slate-950/60 px-3 py-2 text-xs font-bold text-white/80 hover:border-fuchsia-400 hover:text-white"
                    >
                      🏆
                    </button>
                  </div>

                  {openLB === t.id && (
                    <div className="mt-3 rounded-xl border border-violet-500/20 bg-black/40 p-3">
                      {!lbData[t.id] ? (
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-fuchsia-400" />
                      ) : lbData[t.id].length === 0 ? (
                        <p className="text-center text-xs text-white/60">এখনো কোনো এনট্রি নেই।</p>
                      ) : (
                        <ol className="space-y-1 text-xs">
                          {lbData[t.id].map((r) => (
                            <li key={r.user_id} className="flex items-center justify-between rounded bg-white/5 px-2 py-1">
                              <span className="flex items-center gap-2">
                                <span className={`w-5 text-center font-black ${r.rank === 1 ? "text-yellow-300" : r.rank === 2 ? "text-slate-200" : r.rank === 3 ? "text-amber-500" : "text-white/60"}`}>#{r.rank}</span>
                                <span className="truncate text-white/90">{r.display_name ?? r.username ?? "Player"}</span>
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="text-cyan-300">৳{Number(r.total_wager).toLocaleString("en-BD")}</span>
                                {r.prize > 0 && <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold text-emerald-300">+৳{r.prize}</span>}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </CosmicCard>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-white/50">* Bet placed during tournament window auto-adds to your total. Prizes credited on finalize.</p>
      </section>
    </SiteShell>
  );
}
