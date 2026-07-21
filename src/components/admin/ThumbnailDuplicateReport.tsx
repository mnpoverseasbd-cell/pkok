import { useCallback, useEffect, useState } from "react";
import { listInternalGames } from "@/internal-games/registry";
import { RefreshCw, AlertTriangle, CheckCircle2, ImageOff } from "lucide-react";

type Row = { id: string; name: string; image: string };
type Group = { hash: string; rows: Row[]; preview: string };
type Status = "idle" | "scanning" | "done" | "error";

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function ThumbnailDuplicateReport() {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [groups, setGroups] = useState<Group[]>([]);
  const [failed, setFailed] = useState<Row[]>([]);
  const [totalGames, setTotalGames] = useState(0);

  const scan = useCallback(async () => {
    const games = listInternalGames().map<Row>((g) => ({
      id: g.id,
      name: g.name,
      image: (g.thumbnail || g.image) as string,
    }));
    setTotalGames(games.length);
    setStatus("scanning");
    setProgress({ done: 0, total: games.length });
    setGroups([]);
    setFailed([]);

    const buckets = new Map<string, Row[]>();
    const bad: Row[] = [];

    // Sequential-ish with small concurrency to avoid hammering
    const CONC = 6;
    let cursor = 0;
    async function worker() {
      while (cursor < games.length) {
        const idx = cursor++;
        const g = games[idx];
        try {
          const res = await fetch(g.image, { cache: "force-cache" });
          if (!res.ok) throw new Error(String(res.status));
          const buf = await res.arrayBuffer();
          const hash = await sha256Hex(buf);
          const arr = buckets.get(hash) ?? [];
          arr.push(g);
          buckets.set(hash, arr);
        } catch {
          bad.push(g);
        } finally {
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      }
    }
    try {
      await Promise.all(Array.from({ length: CONC }, worker));
      const dups: Group[] = Array.from(buckets.entries())
        .filter(([, rows]) => rows.length > 1)
        .map(([hash, rows]) => ({ hash, rows, preview: rows[0].image }))
        .sort((a, b) => b.rows.length - a.rows.length);
      setGroups(dups);
      setFailed(bad);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    scan();
  }, [scan]);

  const duplicateGameCount = groups.reduce((n, g) => n + g.rows.length, 0);
  const uniqueCount = totalGames - duplicateGameCount - failed.length + groups.length;

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">Thumbnail Duplicate Report</div>
              <div className="text-xs text-slate-500">সমস্ত গেমের থাম্বনেইলের SHA-256 হ্যাশ মিলিয়ে ডুপ্লিকেট ছবি সনাক্ত করে</div>
            </div>
          </div>
        </div>
        <button
          onClick={scan}
          disabled={status === "scanning"}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${status === "scanning" ? "animate-spin" : ""}`} />
          {status === "scanning" ? "Scanning…" : "Re-scan"}
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total games" value={totalGames} tone="slate" />
        <Stat label="Unique thumbnails" value={Math.max(0, uniqueCount)} tone="emerald" />
        <Stat label="Duplicate images" value={duplicateGameCount} tone="rose" />
        <Stat label="Failed to load" value={failed.length} tone="amber" />
      </div>

      {status === "scanning" && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-500">
            <span>Scanning thumbnails…</span>
            <span>{progress.done} / {progress.total}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {status === "done" && groups.length === 0 && failed.length === 0 && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          <div className="text-sm font-bold">দুর্দান্ত! প্রতিটি গেমের থাম্বনেইল ইউনিক।</div>
        </div>
      )}

      {status === "done" && groups.length > 0 && (
        <div className="mt-5 space-y-4">
          <div className="text-xs font-bold uppercase tracking-widest text-rose-500">
            {groups.length} duplicate group{groups.length > 1 ? "s" : ""} found
          </div>
          {groups.map((g) => (
            <div key={g.hash} className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
              <div className="flex items-start gap-4">
                <img
                  src={g.preview}
                  alt="duplicate thumbnail"
                  loading="lazy"
                  className="h-20 w-20 rounded-lg object-cover ring-2 ring-rose-200"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                      {g.rows.length} games share this image
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">hash: {g.hash.slice(0, 12)}…</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {g.rows.map((r) => (
                      <span
                        key={r.id}
                        className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200"
                        title={r.id}
                      >
                        {r.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {status === "done" && failed.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-700">
            <ImageOff className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-widest">Failed to load ({failed.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {failed.map((r) => (
              <span key={r.id} className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                {r.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          স্ক্যান ব্যর্থ হয়েছে। আবার চেষ্টা করুন।
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "slate" | "emerald" | "rose" | "amber" }) {
  const toneMap = {
    slate: "from-slate-500 to-slate-700",
    emerald: "from-emerald-500 to-teal-500",
    rose: "from-rose-500 to-pink-500",
    amber: "from-amber-500 to-orange-500",
  } as const;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`mt-1 bg-gradient-to-r ${toneMap[tone]} bg-clip-text text-2xl font-black text-transparent`}>
        {value}
      </div>
    </div>
  );
}
