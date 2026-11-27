// Shared in-memory live bets feed. Bootstraps with simulated bets and
// accepts real ones pushed from games. Broadcasts to subscribers.

export type LiveBet = {
  id: string;
  ts: number;
  user: string;      // display name (masked for real users)
  game: string;      // "plinko" | "crash" | ...
  bet: number;
  multiplier: number;
  payout: number;    // 0 if lost
  isMe?: boolean;
};

const FAKE_USERS = [
  "R***a", "K***n", "Sh***", "N***b", "T***q", "A***", "M***", "Za***",
  "L***y", "Vi***", "Ja***", "Sa***", "Ni***", "Ha***", "Fa***", "Ri***",
];
const GAMES = ["plinko", "crash", "wheel", "dice", "limbo", "mines", "coinflip"];

const HIST_MAX = 40;
let feed: LiveBet[] = [];
const listeners = new Set<(f: LiveBet[]) => void>();
let ticker: ReturnType<typeof setInterval> | null = null;

function emit() {
  for (const l of listeners) l(feed);
}

function fakeBet(): LiveBet {
  const bet = [10, 25, 50, 100, 200, 500, 1000][Math.floor(Math.random() * 7)];
  // Weighted multiplier distribution — mostly small, occasional big win
  const r = Math.random();
  const mult = r < 0.55 ? 0
    : r < 0.85 ? +(0.5 + Math.random() * 1.5).toFixed(2)
    : r < 0.97 ? +(2 + Math.random() * 5).toFixed(2)
    : +(10 + Math.random() * 40).toFixed(2);
  const payout = Math.floor(bet * mult);
  return {
    id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    user: FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)],
    game: GAMES[Math.floor(Math.random() * GAMES.length)],
    bet, multiplier: mult, payout,
  };
}

function seed() {
  if (feed.length > 0) return;
  const now = Date.now();
  for (let i = 0; i < 12; i++) {
    const b = fakeBet();
    b.ts = now - i * 1500;
    feed.push(b);
  }
}

function ensureTicker() {
  if (ticker || typeof window === "undefined") return;
  seed();
  ticker = setInterval(() => {
    pushLiveBet(fakeBet());
  }, 2200 + Math.random() * 1800);
}

export function pushLiveBet(b: LiveBet) {
  feed = [b, ...feed].slice(0, HIST_MAX);
  emit();
}

export function subscribeLiveBets(cb: (f: LiveBet[]) => void) {
  ensureTicker();
  listeners.add(cb);
  cb(feed);
  return () => { listeners.delete(cb); };
}

const GAME_LABELS: Record<string, string> = {
  crash: "Crash 🚀",
  dice: "Lucky Dice 🎲",
  coinflip: "Coin Flip 🪙",
  limbo: "Limbo 🚀",
  mines: "Mines 💣",
  plinko: "Plinko 🎯",
  wheel: "Wheel 🎡",
  "super-ace": "Super Ace 🂡",
};

/** Convenience: record a real bet from a game. Also persists to bet history and shows a result toast. */
export function recordMyBet(input: { user?: string; game: string; bet: number; multiplier: number; payout: number }) {
  pushLiveBet({
    id: `me-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    user: input.user || "You",
    game: input.game,
    bet: input.bet,
    multiplier: input.multiplier,
    payout: input.payout,
    isMe: true,
  });
  // Fire-and-forget: persist to per-user history (localStorage).
  import("./betHistory").then(({ addBetHistory }) => {
    addBetHistory({ game: input.game, bet: input.bet, multiplier: input.multiplier, payout: input.payout });
  }).catch(() => { /* ignore */ });
  // Show a big, clear win/lose toast so users always see the outcome.
  import("sonner").then(({ toast }) => {
    const label = GAME_LABELS[input.game] ?? input.game;
    const pnl = input.payout - input.bet;
    if (pnl > 0) {
      toast.success(`🎉 জিতেছেন +৳${pnl.toLocaleString("en-BD")}`, {
        description: `${label} · ${input.multiplier.toFixed(2)}× · পেআউট ৳${input.payout.toLocaleString("en-BD")}`,
        duration: 3500,
      });
    } else if (pnl < 0) {
      toast.error(`💥 হেরেছেন ৳${Math.abs(pnl).toLocaleString("en-BD")}`, {
        description: `${label} · বাজি ছিল ৳${input.bet.toLocaleString("en-BD")}`,
        duration: 3000,
      });
    } else {
      toast(`↩️ পুশ · ${label}`, { duration: 2000 });
    }
  }).catch(() => { /* ignore */ });
}

