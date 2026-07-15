import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Coins, Flame, Trophy, Users } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";

export const Route = createFileRoute("/tournaments")({
  head: () => ({
    meta: [
      { title: "টুর্নামেন্ট — PKOK" },
      { name: "description", content: "লাইভ ও আসন্ন টুর্নামেন্ট — বড় প্রাইজ পুলে অংশ নিন এবং জিতুন এক্সক্লুসিভ পুরস্কার।" },
      { property: "og:title", content: "টুর্নামেন্ট — PKOK" },
      { property: "og:description", content: "লাইভ ও আসন্ন টুর্নামেন্টে অংশ নিন।" },
    ],
  }),
  component: TournamentsPage,
});

type Tournament = {
  id: string;
  title: string;
  category: string;
  prize: number;
  entrants: number;
  capacity: number;
  status: "live" | "upcoming" | "ended";
  startsAt: number;
  endsAt: number;
};

const now = Date.now();
const H = 60 * 60 * 1000;
const D = 24 * H;

const items: Tournament[] = [
  { id: "t1", title: "Slots Mania Weekly", category: "Slots", prize: 500_000, entrants: 1420, capacity: 2000, status: "live", startsAt: now - 2 * D, endsAt: now + 3 * D },
  { id: "t2", title: "Aviator Rush", category: "Crash", prize: 250_000, entrants: 812, capacity: 1500, status: "live", startsAt: now - 12 * H, endsAt: now + 36 * H },
  { id: "t3", title: "Baccarat Kings", category: "Live", prize: 750_000, entrants: 320, capacity: 1000, status: "upcoming", startsAt: now + 2 * D, endsAt: now + 9 * D },
  { id: "t4", title: "Fishing Cup", category: "Fishing", prize: 180_000, entrants: 0, capacity: 800, status: "upcoming", startsAt: now + 5 * D, endsAt: now + 12 * D },
  { id: "t5", title: "Poker Bangla Series", category: "Poker", prize: 1_000_000, entrants: 0, capacity: 500, status: "upcoming", startsAt: now + 7 * D, endsAt: now + 21 * D },
  { id: "t6", title: "Mega Slots Championship", category: "Slots", prize: 2_000_000, entrants: 5000, capacity: 5000, status: "ended", startsAt: now - 20 * D, endsAt: now - 5 * D },
];

function Countdown({ to }: { to: number }) {
  const [t, setT] = useState(to - Date.now());
  useEffect(() => {
    const i = setInterval(() => setT(to - Date.now()), 1000);
    return () => clearInterval(i);
  }, [to]);
  if (t <= 0) return <span className="text-white/60">শেষ</span>;
  const d = Math.floor(t / D);
  const h = Math.floor((t % D) / H);
  const m = Math.floor((t % H) / (60 * 1000));
  const s = Math.floor((t % (60 * 1000)) / 1000);
  return (
    <span className="font-mono font-bold text-[var(--neon-gold)]">
      {d > 0 ? `${d}d ` : ""}
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

function TournamentsPage() {
  const [tab, setTab] = useState<"live" | "upcoming" | "ended">("live");
  const filtered = items.filter((i) => i.status === tab);

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pt-6 sm:px-4 lg:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--neon-green)]/45 panel-dark p-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(51,255,153,0.18),transparent_55%)]" />
          <div className="relative">
            <Trophy className="mx-auto h-10 w-10 text-[var(--neon-green)]" />
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              <span className="text-gradient-gold">টুর্নামেন্ট</span> সেন্টার
            </h1>
            <p className="mt-2 text-sm text-foreground/80">লাইভ ও আসন্ন টুর্নামেন্টে অংশ নিন — কোটি টাকার প্রাইজ পুল অপেক্ষা করছে।</p>
          </div>
        </div>

        <div className="mx-auto mt-5 inline-flex rounded-full border border-white/10 bg-black/40 p-1">
          {(["live", "upcoming", "ended"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-1.5 text-sm font-bold capitalize transition ${
                tab === t ? "bg-green-button text-[var(--background)]" : "text-white/70 hover:text-white"
              }`}
            >
              {t === "live" ? "লাইভ" : t === "upcoming" ? "আসন্ন" : "শেষ হয়েছে"}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-10 text-center text-white/70">
            এই ক্যাটাগরিতে কোনো টুর্নামেন্ট নেই।
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const pct = Math.min(100, Math.round((t.entrants / t.capacity) * 100));
              const isLive = t.status === "live";
              return (
                <div key={t.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-[var(--neon-gold)]/60 hover:shadow-[0_0_25px_rgba(255,214,54,0.25)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70">
                        {t.category}
                      </div>
                      <h3 className="mt-2 text-lg font-black text-white">{t.title}</h3>
                    </div>
                    {isLive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                        <Flame className="h-3 w-3" /> LIVE
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/80">
                    <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                      <div className="flex items-center gap-1 text-white/60"><Coins className="h-3 w-3" /> প্রাইজ পুল</div>
                      <div className="mt-0.5 font-black text-[var(--neon-gold)]">৳ {t.prize.toLocaleString("en-BD")}</div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                      <div className="flex items-center gap-1 text-white/60"><CalendarClock className="h-3 w-3" /> {isLive ? "শেষ হবে" : t.status === "upcoming" ? "শুরু হবে" : "শেষ হয়েছে"}</div>
                      <div className="mt-0.5">
                        {t.status === "ended" ? (
                          <span className="font-bold text-white/60">শেষ</span>
                        ) : (
                          <Countdown to={isLive ? t.endsAt : t.startsAt} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {t.entrants.toLocaleString("en-BD")} / {t.capacity.toLocaleString("en-BD")}</span>
                      <span>{pct}% পূর্ণ</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/60">
                      <div className="h-full rounded-full bg-gradient-to-r from-[var(--neon-green)] to-[var(--neon-gold)]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <button
                    disabled={t.status === "ended"}
                    onClick={() => toast.success(`${t.title} — এনরোল সফল!`)}
                    className="mt-4 w-full rounded-full bg-gold-button py-2 text-sm font-black text-[var(--background)] disabled:opacity-50"
                  >
                    {t.status === "ended" ? "সমাপ্ত" : t.status === "live" ? "এখনই যোগ দিন" : "এনরোল করুন"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
