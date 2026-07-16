// Persistent per-user bet history stored in localStorage. Shared across all
// games. Kept small (last 100) to avoid bloating storage.

export type BetHistoryEntry = {
  id: string;
  ts: number;
  game: string;
  bet: number;
  multiplier: number;
  payout: number; // 0 if lost
};

const KEY = "asik.betHistory.v1";
const MAX = 100;

let cache: BetHistoryEntry[] | null = null;
const listeners = new Set<(h: BetHistoryEntry[]) => void>();

function load(): BetHistoryEntry[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as BetHistoryEntry[]) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function save() {
  if (typeof window === "undefined" || !cache) return;
  try { window.localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* quota */ }
}

function emit() {
  const snap = load();
  for (const l of listeners) l(snap);
}

export function addBetHistory(entry: Omit<BetHistoryEntry, "id" | "ts"> & { id?: string; ts?: number }) {
  const list = load();
  const item: BetHistoryEntry = {
    id: entry.id ?? `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ts: entry.ts ?? Date.now(),
    game: entry.game,
    bet: entry.bet,
    multiplier: entry.multiplier,
    payout: entry.payout,
  };
  cache = [item, ...list].slice(0, MAX);
  save();
  emit();
}

export function clearBetHistory() {
  cache = [];
  save();
  emit();
}

export function subscribeBetHistory(cb: (h: BetHistoryEntry[]) => void) {
  listeners.add(cb);
  cb(load());
  return () => { listeners.delete(cb); };
}

export function getBetHistorySnapshot(): BetHistoryEntry[] {
  return load().slice();
}
