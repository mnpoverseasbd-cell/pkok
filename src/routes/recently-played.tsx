import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { Clock, History } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { GameCardMini } from "@/components/GameCardMini";
import { catalogService } from "@/services";
import { useLocalGameList, RECENT_KEY, FAVORITES_KEY } from "@/hooks/useLocalGameList";

export const Route = createFileRoute("/recently-played")({
  head: () => ({
    meta: [
      { title: "সাম্প্রতিক খেলা — PKOK" },
      { name: "description", content: "আপনি যে গেমগুলো সম্প্রতি খেলেছেন সেগুলোর দ্রুত অ্যাক্সেস।" },
    ],
  }),
  component: RecentPage,
});

function RecentPage() {
  const { ids, clear, add: addRecent } = useLocalGameList(RECENT_KEY, 30);
  const { has: isFav, toggle: toggleFav } = useLocalGameList(FAVORITES_KEY);
  const games = useMemo(() => {
    const all = catalogService.all();
    const map = new Map(all.map((g) => [g.id, g]));
    return ids.map((id) => map.get(id)).filter(Boolean) as ReturnType<typeof catalogService.all>;
  }, [ids]);

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pt-6 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--neon-cyan)]/40 panel-dark p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]">
              <Clock className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-white sm:text-3xl">সাম্প্রতিক খেলা</h1>
              <p className="text-sm text-foreground/70">শেষ {games.length} টি গেম</p>
            </div>
          </div>
          {games.length > 0 && (
            <button
              onClick={() => { clear(); toast.success("হিস্টরি ক্লিয়ার হয়েছে"); }}
              className="rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-bold text-white/85 hover:bg-black/60"
            >
              হিস্টরি ক্লিয়ার
            </button>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
        {games.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-10 text-center">
            <History className="mx-auto h-12 w-12 text-white/40" />
            <div className="mt-3 text-lg font-bold text-white">সাম্প্রতিক কোনো গেম নেই</div>
            <p className="mt-1 text-sm text-foreground/70">গেম খেললে সেগুলো এখানে দেখাবে।</p>
            <Link to="/games" className="mt-4 inline-flex rounded-full bg-gold-button px-6 py-2 text-sm font-black text-[var(--background)]">গেম দেখুন</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {games.map((g) => (
              <GameCardMini
                key={g.id}
                game={g}
                isFav={isFav(g.id)}
                onToggleFav={() => { toggleFav(g.id); }}
                onPlay={() => { addRecent(g.id); toast.info(`${g.name} — লঞ্চ শুরু হচ্ছে…`); }}
              />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
