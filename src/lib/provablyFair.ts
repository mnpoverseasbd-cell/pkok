// Provably Fair — Stake-style HMAC-SHA256 based outcome generation.
// Deterministic: given (serverSeed, clientSeed, nonce, cursor) → same float.
// Anyone can verify a past bet after the server seed is revealed.
import { getActiveGameConfig } from "@/hooks/useGameConfig";

function getWinRateRatio(gameKey: string): { ratio: number; edge?: number } {
  const cfg = getActiveGameConfig(gameKey);
  if (!cfg) return { ratio: 1 };
  const wr = Number(cfg.config?.win_rate_pct ?? 50);
  const ratio = Number.isFinite(wr) ? Math.min(1.95, Math.max(0.05, wr / 50)) : 1;
  return { ratio, edge: cfg.house_edge };
}

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
  return s;
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return toHex(buf);
}

export async function hmacSha256(key: string, msg: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return new Uint8Array(sig);
}

/**
 * Generate `count` floats in [0, 1) from (serverSeed, clientSeed, nonce).
 * Uses the Stake algorithm: HMAC bytes → groups of 4 → 32-bit int → /2^32.
 * `cursor` lets a single bet consume more than 8 floats (rehash with cursor+1).
 */
export async function fairFloats(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number = 1,
): Promise<number[]> {
  const out: number[] = [];
  let cursor = 0;
  while (out.length < count) {
    const bytes = await hmacSha256(serverSeed, `${clientSeed}:${nonce}:${cursor}`);
    for (let i = 0; i + 4 <= bytes.length && out.length < count; i += 4) {
      const n =
        (bytes[i] / 256) +
        (bytes[i + 1] / 65536) +
        (bytes[i + 2] / 16777216) +
        (bytes[i + 3] / 4294967296);
      out.push(n);
    }
    cursor++;
  }
  return out;
}

// ---- Per-game outcome helpers ------------------------------------------------

/** Dice: roll in [0, 100). Player wins if roll < target. */
export async function fairDice(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  options?: { winRatePct?: number },
) {
  const [f] = await fairFloats(serverSeed, clientSeed, nonce, 1);
  const ratio =
    options?.winRatePct !== undefined
      ? Math.min(1.95, Math.max(0.05, options.winRatePct / 50))
      : getWinRateRatio("dice").ratio;
  const bf = ratio === 1 ? f : Math.pow(f, ratio);
  return +(bf * 100).toFixed(2);
}

/** Limbo: crash-style multiplier. `edge` in [0,1). */
export async function fairLimbo(
  serverSeed: string, clientSeed: string, nonce: number, edge: number = 0.01,
) {
  const [f] = await fairFloats(serverSeed, clientSeed, nonce, 1);
  const tune = getWinRateRatio("limbo");
  const effEdge = tune.edge ?? edge;
  const m = Math.max(1, ((1 - effEdge) * tune.ratio) / Math.max(f, 1e-9));
  return +Math.min(m, 1_000_000).toFixed(2);
}

/** Crash: same formula as Limbo but with a 1/N instant-bust chance. */
export async function fairCrash(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  edge: number = 0.01,
  options?: { winRatePct?: number },
) {
  const [f] = await fairFloats(serverSeed, clientSeed, nonce, 1);
  const tune = getWinRateRatio("crash");
  const ratio =
    options?.winRatePct !== undefined
      ? Math.min(1.95, Math.max(0.05, options.winRatePct / 50))
      : tune.ratio;
  const effEdge = options?.winRatePct !== undefined ? edge : (tune.edge ?? edge);
  const bustProb = Math.min(0.95, Math.max(0.005, ratio < 1 ? 0.03 + (1 - ratio) * 0.55 : 0.03 / ratio));
  if (f < bustProb) return 1.0;
  const m = Math.max(1, ((1 - effEdge) * ratio) / Math.max(f, 1e-9));
  return +Math.min(m, 1_000_000).toFixed(2);
}

/** Coinflip: true = heads, false = tails. */
export async function fairCoinflip(serverSeed: string, clientSeed: string, nonce: number) {
  const [f] = await fairFloats(serverSeed, clientSeed, nonce, 1);
  return f < 0.5;
}

/** Wheel: returns segment index in [0, segments). */
export async function fairWheel(
  serverSeed: string, clientSeed: string, nonce: number, segments: number,
) {
  const [f] = await fairFloats(serverSeed, clientSeed, nonce, 1);
  return Math.min(segments - 1, Math.floor(f * segments));
}

/** Plinko: array of `rows` bits (0 = left, 1 = right). Final bucket = sum. */
export async function fairPlinko(
  serverSeed: string, clientSeed: string, nonce: number, rows: number,
) {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, rows);
  return floats.map((f) => (f < 0.5 ? 0 : 1));
}

/** Mines: pick `count` unique cells from [0, total). */
export async function fairMines(
  serverSeed: string, clientSeed: string, nonce: number, total: number, count: number,
) {
  // Fisher-Yates using fresh floats
  const floats = await fairFloats(serverSeed, clientSeed, nonce, total);
  const arr = Array.from({ length: total }, (_, i) => i);
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(floats[i] * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count).sort((a, b) => a - b);
}

/**
 * Andar Bahar: shuffle a 52-card deck, first card is the Joker (revealed).
 * Deal alternately Bahar → Andar until a card matches the Joker's rank.
 * Returns the joker index, the two piles built up to (and including) the match,
 * and the winning side.
 * Card encoding: 0..51 where rank = card % 13, suit = Math.floor(card / 13).
 */
export async function fairAndarBahar(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<{
  joker: number;
  andar: number[];
  bahar: number[];
  winner: "A" | "B";
  cardsDrawn: number;
}> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 52);
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 51; i > 0; i--) {
    const j = Math.floor(floats[i] * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const joker = deck[0];
  const jokerRank = joker % 13;
  const andar: number[] = [];
  const bahar: number[] = [];
  let winner: "A" | "B" = "B";
  let pos = 1;
  let drawn = 0;
  while (pos < 52) {
    const cb = deck[pos++];
    bahar.push(cb);
    drawn++;
    if (cb % 13 === jokerRank) { winner = "B"; break; }
    if (pos >= 52) break;
    const ca = deck[pos++];
    andar.push(ca);
    drawn++;
    if (ca % 13 === jokerRank) { winner = "A"; break; }
  }
  return { joker, andar, bahar, winner, cardsDrawn: drawn };
}

/**
 * Dragon Tiger: draw two distinct cards from a shuffled 52-card deck.
 * Rank order A(0) < 2 < ... < K(12). Higher rank wins; equal rank = Tie.
 */
export async function fairDragonTiger(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<{ dragon: number; tiger: number; winner: "D" | "T" | "TIE" }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 52);
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 51; i > 0; i--) {
    const j = Math.floor(floats[i] * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const dragon = deck[0];
  const tiger = deck[1];
  const dr = dragon % 13;
  const tr = tiger % 13;
  const winner: "D" | "T" | "TIE" = dr === tr ? "TIE" : dr > tr ? "D" : "T";
  return { dragon, tiger, winner };
}

/**
 * Teen Patti: shuffle 52-card deck and deal 3 cards each to Player and Dealer.
 * Card encoding: 0..51 where rank = card % 13 (0=A, 1=2, ..., 12=K), suit = card / 13.
 * Returns hands, category names, and winner. Ace can be high or low in straights.
 */
export type TeenPattiCategory =
  | "Trail" | "Pure Sequence" | "Sequence" | "Color" | "Pair" | "High Card";

function tpScore(cards: number[]): { score: number; category: TeenPattiCategory } {
  // Rank values: A=14, 2=2, ... K=13. But A also = 1 for A-2-3 straight.
  const ranks = cards.map((c) => {
    const r = c % 13;
    return r === 0 ? 14 : r + 1; // A=14, 2=2, K=13
  }).sort((a, b) => b - a);
  const suits = cards.map((c) => Math.floor(c / 13));
  const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
  // Check straight: consecutive OR the special A-2-3 (14,3,2)
  const [a, b, c] = ranks;
  const consecutive = a - b === 1 && b - c === 1;
  const aceLow = a === 14 && b === 3 && c === 2;
  const isStraight = consecutive || aceLow;
  const isTrail = a === b && b === c;
  const isPair = !isTrail && (a === b || b === c);
  // Kicker encoding
  let pairRank = 0, kicker = 0;
  if (isPair) {
    if (a === b) { pairRank = a; kicker = c; }
    else { pairRank = b; kicker = a; }
  }
  const straightHigh = aceLow ? 3 : a;
  // Score: [category(3 digits)][top(2)][mid(2)][low(2)][extra(2)]
  const enc = (cat: number, x1: number, x2: number, x3: number, x4 = 0) =>
    cat * 1e8 + x1 * 1e6 + x2 * 1e4 + x3 * 1e2 + x4;
  if (isTrail) return { score: enc(6, a, 0, 0), category: "Trail" };
  if (isStraight && isFlush) return { score: enc(5, straightHigh, 0, 0), category: "Pure Sequence" };
  if (isStraight) return { score: enc(4, straightHigh, 0, 0), category: "Sequence" };
  if (isFlush) return { score: enc(3, a, b, c), category: "Color" };
  if (isPair) return { score: enc(2, pairRank, kicker, 0), category: "Pair" };
  return { score: enc(1, a, b, c), category: "High Card" };
}

export async function fairTeenPatti(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<{
  player: number[];
  dealer: number[];
  playerCategory: TeenPattiCategory;
  dealerCategory: TeenPattiCategory;
  winner: "P" | "D" | "TIE";
}> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 52);
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 51; i > 0; i--) {
    const j = Math.floor(floats[i] * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const player = [deck[0], deck[2], deck[4]];
  const dealer = [deck[1], deck[3], deck[5]];
  const ps = tpScore(player);
  const ds = tpScore(dealer);
  const winner: "P" | "D" | "TIE" =
    ps.score === ds.score ? "TIE" : ps.score > ds.score ? "P" : "D";
  return {
    player, dealer,
    playerCategory: ps.category,
    dealerCategory: ds.category,
    winner,
  };
}

/**
 * 7 Up 7 Down: roll two dice (1..6 each). Sum in 2..12.
 * <7 = Down, =7 = Lucky Seven, >7 = Up.
 */
export async function fairSevenUpDown(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<{ d1: number; d2: number; sum: number; result: "UP" | "DOWN" | "SEVEN" }> {
  const [f1, f2] = await fairFloats(serverSeed, clientSeed, nonce, 2);
  const d1 = 1 + Math.floor(f1 * 6);
  const d2 = 1 + Math.floor(f2 * 6);
  const sum = d1 + d2;
  const result: "UP" | "DOWN" | "SEVEN" = sum === 7 ? "SEVEN" : sum > 7 ? "UP" : "DOWN";
  return { d1, d2, sum, result };
}

/**
 * Baccarat (Punto Banco): shuffle a 52-card deck, deal 2 cards each to
 * Player and Banker, apply standard third-card rules.
 * Values: A=1, 2..9=face, 10/J/Q/K=0. Hand total = sum mod 10.
 * Payouts (caller applies): Player 2×, Banker 1.95× (5% commission), Tie 9×.
 */
export type BaccaratWinner = "P" | "B" | "TIE";
const bacValue = (c: number) => {
  const r = c % 13; // 0=A, 1=2, ..., 9=10, 10=J, 11=Q, 12=K
  if (r === 0) return 1;
  if (r >= 9) return 0;
  return r + 1;
};
const bacTotal = (cards: number[]) =>
  cards.reduce((s, c) => s + bacValue(c), 0) % 10;

export async function fairBaccarat(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<{
  player: number[];
  banker: number[];
  playerTotal: number;
  bankerTotal: number;
  winner: BaccaratWinner;
  isNatural: boolean;
}> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 52);
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 51; i > 0; i--) {
    const j = Math.floor(floats[i] * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const player = [deck[0], deck[2]];
  const banker = [deck[1], deck[3]];
  let idx = 4;

  let pt = bacTotal(player);
  let bt = bacTotal(banker);
  const isNatural = pt >= 8 || bt >= 8;

  if (!isNatural) {
    // Player rule
    let playerThird: number | null = null;
    if (pt <= 5) {
      playerThird = deck[idx++];
      player.push(playerThird);
      pt = bacTotal(player);
    }
    // Banker rule
    let bankerDraws = false;
    if (playerThird === null) {
      // Player stood → banker draws on 0-5
      bankerDraws = bt <= 5;
    } else {
      const pv = bacValue(playerThird);
      if (bt <= 2) bankerDraws = true;
      else if (bt === 3) bankerDraws = pv !== 8;
      else if (bt === 4) bankerDraws = pv >= 2 && pv <= 7;
      else if (bt === 5) bankerDraws = pv >= 4 && pv <= 7;
      else if (bt === 6) bankerDraws = pv === 6 || pv === 7;
      // bt >= 7 stands
    }
    if (bankerDraws) {
      banker.push(deck[idx++]);
      bt = bacTotal(banker);
    }
  }

  const winner: BaccaratWinner = pt === bt ? "TIE" : pt > bt ? "P" : "B";
  return { player, banker, playerTotal: pt, bankerTotal: bt, winner, isNatural };
}


/**
 * Sic Bo: roll 3 dice (1..6 each). Sum in 3..18.
 * Common bets:
 *  - Small (sum 4..10, NOT triple) → 1.95×
 *  - Big   (sum 11..17, NOT triple) → 1.95×
 *  - Odd   (odd sum, NOT triple)    → 1.95×
 *  - Even  (even sum, NOT triple)   → 1.95×
 *  - Any Triple (all 3 dice equal)  → 8×  (higher variance)
 *  - Specific Triple 1..6           → 150× (rarer)
 */
export async function fairSicBo(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<{
  d1: number; d2: number; d3: number;
  sum: number;
  isTriple: boolean;
  tripleFace: number | null;
  size: "SMALL" | "BIG" | null; // null on triple
  parity: "ODD" | "EVEN" | null; // null on triple
}> {
  const [f1, f2, f3] = await fairFloats(serverSeed, clientSeed, nonce, 3);
  const d1 = 1 + Math.floor(f1 * 6);
  const d2 = 1 + Math.floor(f2 * 6);
  const d3 = 1 + Math.floor(f3 * 6);
  const sum = d1 + d2 + d3;
  const isTriple = d1 === d2 && d2 === d3;
  const tripleFace = isTriple ? d1 : null;
  const size = isTriple ? null : sum >= 11 ? "BIG" : "SMALL";
  const parity = isTriple ? null : sum % 2 === 0 ? "EVEN" : "ODD";
  return { d1, d2, d3, sum, isTriple, tripleFace, size, parity };
}

/**
 * Blackjack: shuffle a 52-card deck deterministically. The route reveals
 * cards in order as the player Hits/Stands/Doubles.
 * Card values: A=1 or 11, 2..9 = face, 10/J/Q/K = 10.
 */
export async function fairBlackjackDeck(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<number[]> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 52);
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 51; i > 0; i--) {
    const j = Math.floor(floats[i] * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Blackjack card value helper. */
export function bjValue(card: number): number {
  const r = card % 13; // 0=A, 1=2, ..., 9=10, 10=J, 11=Q, 12=K
  if (r === 0) return 11; // Ace as 11; caller downgrades if bust
  if (r >= 9) return 10;
  return r + 1;
}

/** Best (non-bust preferred) blackjack hand total. */
export function bjTotal(cards: number[]): { total: number; soft: boolean } {
  let total = cards.reduce((s, c) => s + bjValue(c), 0);
  let aces = cards.filter((c) => c % 13 === 0).length;
  let soft = aces > 0;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  if (aces === 0) soft = false;
  return { total, soft };
}


/**
 * Roulette (European single-zero, 0..36).
 * Red pockets by tradition:
 *   1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
 * Zero is green.
 */
export const ROULETTE_RED = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export async function fairRoulette(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<{
  pocket: number;
  color: "RED" | "BLACK" | "GREEN";
  parity: "ODD" | "EVEN" | null;
  size: "LOW" | "HIGH" | null;   // 1-18 / 19-36
  dozen: 1 | 2 | 3 | null;       // 1-12 / 13-24 / 25-36
  column: 1 | 2 | 3 | null;      // by (n-1)%3
}> {
  const [f] = await fairFloats(serverSeed, clientSeed, nonce, 1);
  const pocket = Math.floor(f * 37); // 0..36
  const color: "RED" | "BLACK" | "GREEN" =
    pocket === 0 ? "GREEN" : ROULETTE_RED.has(pocket) ? "RED" : "BLACK";
  const parity = pocket === 0 ? null : pocket % 2 === 0 ? "EVEN" : "ODD";
  const size = pocket === 0 ? null : pocket <= 18 ? "LOW" : "HIGH";
  const dozen = pocket === 0 ? null : (Math.ceil(pocket / 12) as 1 | 2 | 3);
  const column = pocket === 0 ? null : (((pocket - 1) % 3) + 1) as 1 | 2 | 3;
  return { pocket, color, parity, size, dozen, column };
}


/**
 * 32 Cards (BD live-casino classic).
 * 32-card deck: ranks 7,8,9,10,J,Q,K,A of all 4 suits.
 * Encoding: card = suit*8 + idx, where idx 0..7 ↔ [7,8,9,10,J,Q,K,A].
 * Players A(8), B(9), C(10), D(11) start with their base score.
 * All 32 cards dealt in rotation A→B→C→D (8 each).
 * Values: 7..10 face, J=11, Q=12, K=13, A=1.
 * Highest total wins; on tie, house wins.
 */
export type ThirtyTwoPlayer = "A" | "B" | "C" | "D";
export const T32_RANK_LABELS = ["7", "8", "9", "10", "J", "Q", "K", "A"];
export const T32_SUITS = ["♠", "♥", "♦", "♣"];
export const T32_BASE: Record<ThirtyTwoPlayer, number> = { A: 8, B: 9, C: 10, D: 11 };
const T32_VAL = [7, 8, 9, 10, 11, 12, 13, 1];

export function t32CardLabel(card: number): string {
  const suit = Math.floor(card / 8);
  const idx = card % 8;
  return `${T32_RANK_LABELS[idx]}${T32_SUITS[suit]}`;
}
export function t32CardSuit(card: number): number {
  return Math.floor(card / 8);
}
export function t32CardValue(card: number): number {
  return T32_VAL[card % 8];
}

export async function fair32Cards(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<{
  deck: number[];
  hands: Record<ThirtyTwoPlayer, number[]>;
  totals: Record<ThirtyTwoPlayer, number>;
  winner: ThirtyTwoPlayer | "TIE";
}> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 32);
  const deck = Array.from({ length: 32 }, (_, i) => i);
  for (let i = 31; i > 0; i--) {
    const j = Math.floor(floats[i] * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const order: ThirtyTwoPlayer[] = ["A", "B", "C", "D"];
  const hands: Record<ThirtyTwoPlayer, number[]> = { A: [], B: [], C: [], D: [] };
  for (let i = 0; i < 32; i++) hands[order[i % 4]].push(deck[i]);
  const totals: Record<ThirtyTwoPlayer, number> = {
    A: T32_BASE.A, B: T32_BASE.B, C: T32_BASE.C, D: T32_BASE.D,
  };
  for (const p of order) for (const c of hands[p]) totals[p] += t32CardValue(c);
  const max = Math.max(totals.A, totals.B, totals.C, totals.D);
  const winners = order.filter((p) => totals[p] === max);
  const winner: ThirtyTwoPlayer | "TIE" = winners.length === 1 ? winners[0] : "TIE";
  return { deck, hands, totals, winner };
}


/**
 * Video Poker — Jacks or Better (9/6 full pay).
 * Uses the same shuffled 52-card deck as blackjack. First 5 cards = initial
 * hand. The next 5 cards (indices 5..9) are the ordered replacement pool used
 * for any discarded slots (in ascending slot order).
 */
export async function fairVideoPokerDeck(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<number[]> {
  return fairBlackjackDeck(serverSeed, clientSeed, nonce);
}

export type VPRank =
  | "ROYAL_FLUSH" | "STRAIGHT_FLUSH" | "FOUR_KIND" | "FULL_HOUSE"
  | "FLUSH" | "STRAIGHT" | "THREE_KIND" | "TWO_PAIR" | "JACKS_BETTER" | "NONE";

export const VP_PAYOUTS: Record<VPRank, number> = {
  ROYAL_FLUSH: 800,
  STRAIGHT_FLUSH: 50,
  FOUR_KIND: 25,
  FULL_HOUSE: 9,
  FLUSH: 6,
  STRAIGHT: 4,
  THREE_KIND: 3,
  TWO_PAIR: 2,
  JACKS_BETTER: 1,
  NONE: 0,
};

export const VP_LABEL: Record<VPRank, string> = {
  ROYAL_FLUSH: "Royal Flush",
  STRAIGHT_FLUSH: "Straight Flush",
  FOUR_KIND: "Four of a Kind",
  FULL_HOUSE: "Full House",
  FLUSH: "Flush",
  STRAIGHT: "Straight",
  THREE_KIND: "Three of a Kind",
  TWO_PAIR: "Two Pair",
  JACKS_BETTER: "Jacks or Better",
  NONE: "No Win",
};

export function evaluateVideoPokerHand(cards: number[]): VPRank {
  if (cards.length !== 5) return "NONE";
  const ranks = cards.map((c) => c % 13); // 0=A,1=2..9=10,10=J,11=Q,12=K
  const suits = cards.map((c) => Math.floor(c / 13));
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const countVals = [...counts.values()].sort((a, b) => b - a);
  const isFlush = suits.every((s) => s === suits[0]);

  const orderHigh = ranks.map((r) => (r === 0 ? 14 : r + 1)).sort((a, b) => a - b);
  const orderLow = ranks.map((r) => (r === 0 ? 1 : r + 1)).sort((a, b) => a - b);
  const isSeq = (arr: number[]) => new Set(arr).size === 5 && arr[4] - arr[0] === 4;
  const isStraight = isSeq(orderHigh) || isSeq(orderLow);
  const isRoyal = isFlush && isSeq(orderHigh) && orderHigh[0] === 10;

  if (isRoyal) return "ROYAL_FLUSH";
  if (isFlush && isStraight) return "STRAIGHT_FLUSH";
  if (countVals[0] === 4) return "FOUR_KIND";
  if (countVals[0] === 3 && countVals[1] === 2) return "FULL_HOUSE";
  if (isFlush) return "FLUSH";
  if (isStraight) return "STRAIGHT";
  if (countVals[0] === 3) return "THREE_KIND";
  if (countVals[0] === 2 && countVals[1] === 2) return "TWO_PAIR";
  if (countVals[0] === 2) {
    for (const [r, c] of counts.entries()) {
      if (c === 2 && (r === 0 || r >= 10)) return "JACKS_BETTER";
    }
  }
  return "NONE";
}

// ---- Slots · Cosmic Fortune (5 reels × 3 rows, 10 paylines) ------------------

export const SLOT_SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "💎", "7️⃣"] as const;
export const SLOT_NAMES = ["Cherry", "Lemon", "Bell", "Star", "Diamond", "Seven"] as const;
const SLOT_WEIGHTS = [30, 25, 18, 14, 9, 4];
const SLOT_CUM = (() => {
  const c: number[] = [];
  let s = 0;
  for (const w of SLOT_WEIGHTS) { s += w; c.push(s); }
  return c;
})();
const SLOT_TOTAL = SLOT_CUM[SLOT_CUM.length - 1];

/** Payout per line for [3, 4, 5] of a kind, indexed by symbol. */
export const SLOT_PAYTABLE: number[][] = [
  [1, 2, 5],     // 🍒
  [1, 3, 8],     // 🍋
  [2, 5, 15],    // 🔔
  [3, 8, 25],    // ⭐
  [5, 15, 50],   // 💎
  [10, 40, 200], // 7️⃣
];

/** 10 fixed paylines (row indices per reel: 0=top, 1=mid, 2=bottom). */
export const SLOT_PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [1, 1, 2, 1, 1],
];

function pickSymbol(f: number): number {
  const t = f * SLOT_TOTAL;
  for (let i = 0; i < SLOT_CUM.length; i++) if (t < SLOT_CUM[i]) return i;
  return SLOT_CUM.length - 1;
}

export type SlotLineWin = { line: number; symbol: number; count: number; payout: number };
export type SlotResult = {
  grid: number[][];        // [row 0..2][col 0..4]
  wins: SlotLineWin[];
  totalMultiplier: number; // sum of line payouts / 10 (per-line bet = bet/10)
};

export async function fairSlots(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<SlotResult> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 15);
  const { ratio } = getWinRateRatio("slots");
  const grid: number[][] = [[], [], []];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 3; row++) {
      grid[row].push(pickSymbol(floats[col * 3 + row]));
    }
  }
  const evalWins = () => {
    const out: SlotLineWin[] = [];
    for (let i = 0; i < SLOT_PAYLINES.length; i++) {
      const line = SLOT_PAYLINES[i];
      const first = grid[line[0]][0];
      let count = 1;
      for (let col = 1; col < 5; col++) {
        if (grid[line[col]][col] === first) count++;
        else break;
      }
      if (count >= 3) {
        const payout = SLOT_PAYTABLE[first][count - 3];
        out.push({ line: i + 1, symbol: first, count, payout });
      }
    }
    return out;
  };
  let wins = evalWins();
  if (ratio < 1 && wins.length > 0 && floats[0] > ratio) {
    // Shift column 2 symbols so winning streaks break under tighter win rate
    for (let r = 0; r < 3; r++) grid[r][2] = (grid[r][0] + 1 + r) % SLOT_SYMBOLS.length;
    wins = evalWins();
  } else if (ratio > 1 && wins.length === 0 && floats[0] < (ratio - 1) * 0.65) {
    // Boost a clean 3-of-a-kind middle line under higher win rate
    const sym = grid[1][0];
    grid[1][1] = sym;
    grid[1][2] = sym;
    wins = evalWins();
  }
  const totalMultiplier = wins.reduce((a, w) => a + w.payout, 0) / 10;
  return { grid, wins, totalMultiplier };
}

// ---- Bingo 75-ball -----------------------------------------------------------

export const BINGO_COLS = ["B", "I", "N", "G", "O"] as const;
export const BINGO_DRAWS = 30;

/** Column i covers numbers [i*15+1 .. i*15+15]. Center (2,2) is FREE. */
export type BingoResult = {
  card: number[][];         // 5×5 (0 at [2][2] = FREE)
  balls: number[];          // 30 unique numbers drawn from 1..75
  marks: boolean[][];       // 5×5, true if that cell was drawn (or FREE)
  patterns: string[];       // e.g. ["Row 3", "Corners", "X", "Full House"]
  multiplier: number;       // total multiplier
};

const BINGO_PATTERN_PAYOUTS: Record<string, number> = {
  LINE: 2,
  CORNERS: 5,
  X: 10,
  FULL: 100,
};

function pickUnique(count: number, from: number, to: number, floats: number[], cursor: { i: number }): number[] {
  // Fisher-Yates on the range [from..to] using floats
  const pool: number[] = [];
  for (let n = from; n <= to; n++) pool.push(n);
  for (let i = pool.length - 1; i > 0 && cursor.i < floats.length; i--) {
    const j = Math.floor(floats[cursor.i++] * (i + 1));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  return pool.slice(0, count);
}

export async function fairBingo(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<BingoResult> {
  // Need floats for 5 columns of 15-pool shuffles (~14 each = 70) + 75 for draw shuffle
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 160);
  const cursor = { i: 0 };

  // Build card: 5 columns, each 5 unique from its range (center replaced with 0 = FREE)
  const card: number[][] = [[], [], [], [], []];
  for (let col = 0; col < 5; col++) {
    const nums = pickUnique(5, col * 15 + 1, col * 15 + 15, floats, cursor);
    for (let row = 0; row < 5; row++) card[row].push(nums[row]);
  }
  card[2][2] = 0; // FREE

  // Draw 30 balls
  const balls = pickUnique(BINGO_DRAWS, 1, 75, floats, cursor);
  const drawn = new Set(balls);

  // Mark card
  const marks: boolean[][] = [];
  for (let r = 0; r < 5; r++) {
    marks.push(card[r].map((n, c) => (r === 2 && c === 2) || drawn.has(n)));
  }

  const isMarked = (r: number, c: number) => marks[r][c];
  const patterns: string[] = [];
  let mult = 0;

  // Rows
  for (let r = 0; r < 5; r++) {
    if ([0, 1, 2, 3, 4].every((c) => isMarked(r, c))) {
      patterns.push(`Row ${r + 1}`);
      mult += BINGO_PATTERN_PAYOUTS.LINE;
    }
  }
  // Columns
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every((r) => isMarked(r, c))) {
      patterns.push(`Col ${BINGO_COLS[c]}`);
      mult += BINGO_PATTERN_PAYOUTS.LINE;
    }
  }
  // Diagonals
  const diag1 = [0, 1, 2, 3, 4].every((i) => isMarked(i, i));
  const diag2 = [0, 1, 2, 3, 4].every((i) => isMarked(i, 4 - i));
  if (diag1) { patterns.push("Diag ↘"); mult += BINGO_PATTERN_PAYOUTS.LINE; }
  if (diag2) { patterns.push("Diag ↙"); mult += BINGO_PATTERN_PAYOUTS.LINE; }
  // 4 corners
  if (isMarked(0, 0) && isMarked(0, 4) && isMarked(4, 0) && isMarked(4, 4)) {
    patterns.push("Corners");
    mult += BINGO_PATTERN_PAYOUTS.CORNERS;
  }
  // X (both diagonals bonus)
  if (diag1 && diag2) {
    patterns.push("X");
    mult += BINGO_PATTERN_PAYOUTS.X;
  }
  // Full house
  let allMarked = true;
  for (let r = 0; r < 5 && allMarked; r++) for (let c = 0; c < 5; c++) if (!marks[r][c]) { allMarked = false; break; }
  if (allMarked) { patterns.push("Full House"); mult += BINGO_PATTERN_PAYOUTS.FULL; }

  return { card, balls, marks, patterns, multiplier: mult };
}


// ---- Matka King (Single Ank + Jodi) -----------------------------------------

export type MatkaResult = {
  single: number;   // 0..9  (single ank)
  jodi: number;     // 0..99 (jodi)
  jodiStr: string;  // "07", "42" etc — always 2 digits
};

/**
 * Draws a single-digit "ank" (0-9) and a two-digit "jodi" (00-99).
 * Both are derived from independent floats — matches classic Matka semantics
 * where players can bet either the day's Single or the Jodi.
 */
export async function fairMatka(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<MatkaResult> {
  const [f1, f2] = await fairFloats(serverSeed, clientSeed, nonce, 2);
  const single = Math.floor(f1 * 10);
  const jodi = Math.floor(f2 * 100);
  return { single, jodi, jodiStr: jodi.toString().padStart(2, "0") };
}


// ---- Fish Shooter · Cast Net -------------------------------------------------

export type FishTier = "small" | "medium" | "big" | "boss" | "mega";

export type FishTierConfig = {
  key: FishTier;
  label: string;
  emoji: string;
  hitProb: number;   // probability the shot lands
  payout: number;    // gross multiplier on hit (pre-house-edge)
};

// hitProb × payout is intentionally < 1 so a house edge is applied on top.
export const FISH_TIERS: FishTierConfig[] = [
  { key: "small",  label: "Small Fry",   emoji: "🐟", hitProb: 0.70, payout: 1.40 },
  { key: "medium", label: "Medium",      emoji: "🐠", hitProb: 0.45, payout: 2.20 },
  { key: "big",    label: "Big Catch",   emoji: "🐡", hitProb: 0.25, payout: 4.00 },
  { key: "boss",   label: "Boss",        emoji: "🦈", hitProb: 0.10, payout: 10.00 },
  { key: "mega",   label: "Mega Boss",   emoji: "🐙", hitProb: 0.03, payout: 33.00 },
];

export type FishShooterResult = {
  tier: FishTier;
  hit: boolean;
  float: number;
  threshold: number; // hitProb for the chosen tier
  payout: number;    // gross payout multiplier (0 if miss)
};

/**
 * One shot targeting a chosen fish tier.
 * float[0] < tier.hitProb ⇒ hit (payout = tier.payout), otherwise miss.
 */
export async function fairFishShooter(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  tier: FishTier,
): Promise<FishShooterResult> {
  const cfg = FISH_TIERS.find((t) => t.key === tier)!;
  const [f] = await fairFloats(serverSeed, clientSeed, nonce, 1);
  const { ratio } = getWinRateRatio("fish-shooter");
  const threshold = Math.min(0.98, Math.max(0.01, cfg.hitProb * ratio));
  const hit = f < threshold;
  return { tier, hit, float: f, threshold, payout: hit ? cfg.payout : 0 };
}


// ---- Fruit Slots · Megaways --------------------------------------------------

export const MEGAWAYS_REELS = 6;
export const MEGAWAYS_MIN_ROWS = 2;
export const MEGAWAYS_MAX_ROWS = 7;
export const MEGAWAYS_SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🍉", "⭐", "💎", "7️⃣"] as const;

const MEGAWAYS_WEIGHTS = [24, 22, 20, 17, 13, 8, 3, 1];

/** Pay-per-way for match length 3, 4, 5, 6 (indexed matchLen-3). */
export const MEGAWAYS_PAYTABLE: Record<number, [number, number, number, number]> = {
  0: [0.20, 0.50, 1.5, 4],
  1: [0.20, 0.50, 1.5, 4],
  2: [0.30, 0.80, 2.0, 5],
  3: [0.40, 1.00, 3.0, 8],
  4: [0.50, 1.50, 4.0, 12],
  5: [1.00, 3.00, 8.0, 25],
  6: [2.00, 6.00, 20, 60],
  7: [5.00, 15.0, 50, 150],
};

export type MegawaysWin = { symbol: number; matchLen: number; ways: number; mult: number };
export type MegawaysResult = {
  heights: number[];
  reels: number[][];
  wins: MegawaysWin[];
  totalMultiplier: number;
  totalWays: number;
};

function pickMegawaysSymbol(f: number): number {
  const total = MEGAWAYS_WEIGHTS.reduce((a, b) => a + b, 0);
  let x = f * total;
  for (let s = 0; s < MEGAWAYS_WEIGHTS.length; s++) {
    x -= MEGAWAYS_WEIGHTS[s];
    if (x < 0) return s;
  }
  return MEGAWAYS_WEIGHTS.length - 1;
}

export async function fairMegaways(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<MegawaysResult> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 60);
  let i = 0;

  const heights: number[] = [];
  for (let r = 0; r < MEGAWAYS_REELS; r++) {
    const span = MEGAWAYS_MAX_ROWS - MEGAWAYS_MIN_ROWS + 1;
    heights.push(MEGAWAYS_MIN_ROWS + Math.floor(floats[i++] * span));
  }

  const reels: number[][] = heights.map((h) => {
    const cells: number[] = [];
    for (let r = 0; r < h; r++) cells.push(pickMegawaysSymbol(floats[i++]));
    return cells;
  });

  const totalWays = heights.reduce((a, b) => a * b, 1);
  const wins: MegawaysWin[] = [];
  let totalMultiplier = 0;

  for (let s = 0; s < MEGAWAYS_SYMBOLS.length; s++) {
    let matchLen = 0;
    let ways = 1;
    for (let r = 0; r < MEGAWAYS_REELS; r++) {
      const c = reels[r].filter((x) => x === s).length;
      if (c === 0) break;
      matchLen++;
      ways *= c;
    }
    if (matchLen >= 3) {
      const pay = MEGAWAYS_PAYTABLE[s][matchLen - 3];
      const mult = +(pay * ways).toFixed(4);
      wins.push({ symbol: s, matchLen, ways, mult });
      totalMultiplier += mult;
    }
  }

  return { heights, reels, wins, totalMultiplier: +totalMultiplier.toFixed(4), totalWays };
}


// ---- Aviatrix Multi-Race -----------------------------------------------------
// 3 planes race, each gets its own crash multiplier from an independent float.
// Winner = highest multiplier. Player picks one plane before the race.

export const AVIATRIX_PLANES = 3;

export async function fairAviatrix(
  serverSeed: string, clientSeed: string, nonce: number, edge: number = 0.01,
): Promise<{ floats: number[]; multipliers: number[]; winner: number }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, AVIATRIX_PLANES);
  const tune = getWinRateRatio("aviatrix");
  const effEdge = tune.edge ?? edge;
  const bustProb = Math.min(0.95, Math.max(0.005, tune.ratio < 1 ? 0.03 + (1 - tune.ratio) * 0.5 : 0.03 / tune.ratio));
  const multipliers = floats.map((f) => {
    if (f < bustProb) return 1.0;
    const m = Math.max(1, ((1 - effEdge) * tune.ratio) / Math.max(f, 1e-9));
    return +Math.min(m, 1_000_000).toFixed(2);
  });
  let winner = 0;
  for (let i = 1; i < multipliers.length; i++) {
    if (multipliers[i] > multipliers[winner]) winner = i;
  }
  return { floats, multipliers, winner };
}


// ---- Dragon Fortune Fishing --------------------------------------------------
// Multi-shot fishing round. User picks shot count (3/5/8). Each shot is one
// independent float that lands on a fish tier (or miss). Total payout is
// sum(shot multipliers) × perShotBet × (1 − edge).

export type DragonFishTier = {
  key: "miss" | "small" | "medium" | "big" | "boss" | "mega";
  emoji: string;
  label: string;
  mult: number;
  threshold: number; // ascending CDF boundary
};

export const DRAGON_FISH_TIERS: DragonFishTier[] = [
  { key: "mega",   emoji: "🐲", label: "Mega Dragon", mult: 20,  threshold: 0.03 },
  { key: "boss",   emoji: "🦈", label: "Boss",        mult: 6,   threshold: 0.10 },
  { key: "big",    emoji: "🐡", label: "Big",         mult: 2.2, threshold: 0.25 },
  { key: "medium", emoji: "🐠", label: "Medium",      mult: 1.1, threshold: 0.55 },
  { key: "small",  emoji: "🐟", label: "Small",       mult: 0.4, threshold: 0.80 },
  { key: "miss",   emoji: "💨", label: "Miss",        mult: 0,   threshold: 1.00 },
];

export const DRAGON_FISHING_SHOT_CHOICES = [3, 5, 8] as const;
export type DragonFishingShotCount = typeof DRAGON_FISHING_SHOT_CHOICES[number];

export type DragonFishingShot = { float: number; tierIndex: number; mult: number };

export async function fairDragonFishing(
  serverSeed: string, clientSeed: string, nonce: number, shots: number,
): Promise<{ shots: DragonFishingShot[]; totalMult: number }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, shots);
  const { ratio } = getWinRateRatio("dragon-fishing");
  const out: DragonFishingShot[] = floats.map((rawF) => {
    const f = ratio === 1 ? rawF : Math.pow(rawF, ratio);
    let idx = DRAGON_FISH_TIERS.length - 1;
    for (let i = 0; i < DRAGON_FISH_TIERS.length; i++) {
      if (f < DRAGON_FISH_TIERS[i].threshold) { idx = i; break; }
    }
    return { float: f, tierIndex: idx, mult: DRAGON_FISH_TIERS[idx].mult };
  });
  const totalMult = +out.reduce((a, s) => a + s.mult, 0).toFixed(4);
  return { shots: out, totalMult };
}


// ---- Penalty Shootout · Golden Boot ------------------------------------------
// Player picks a zone (0..N-1). Keeper zone is derived from an independent
// float per kick. Miss (keeper != player) = goal → multiplier ladders.
// Match = save → round ends, all bet lost. Player may cash out any time.

export const PENALTY_ZONES = ["TL", "TM", "TR", "BL", "BM", "BR"] as const;
export type PenaltyZone = typeof PENALTY_ZONES[number];
export const PENALTY_MAX_KICKS = 10;

/** Base per-kick multiplier before edge: N/(N-1). With N=6 → 1.20. */
export const PENALTY_BASE_MULT = PENALTY_ZONES.length / (PENALTY_ZONES.length - 1);

export async function fairPenalty(
  serverSeed: string, clientSeed: string, nonce: number, kicks: number = PENALTY_MAX_KICKS,
): Promise<{ floats: number[]; keeperZones: number[] }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, kicks);
  const keeperZones = floats.map((f) => Math.floor(f * PENALTY_ZONES.length) % PENALTY_ZONES.length);
  return { floats, keeperZones };
}

/** Ladder: successful kicks → net multiplier after edge. */
export function penaltyLadderMult(kicks: number, edge: number): number {
  return +(Math.pow(PENALTY_BASE_MULT, kicks) * (1 - edge)).toFixed(4);
}


// ---- Cricket Star · Six-Over Chase -------------------------------------------
// Per-ball outcome from a single fair float via an ascending CDF.
// Wicket ends the innings. Any run compounds the multiplier by (1 + runs*k).
// Cash out any time. Max 36 balls (6 overs).

export type CricketOutcomeKey = "W" | "0" | "1" | "2" | "3" | "4" | "6";
export type CricketOutcome = {
  key: CricketOutcomeKey;
  label: string;
  runs: number; // 0 for W/dot
  threshold: number; // ascending CDF boundary
};

// Ascending CDF: check in order, first t where f<t wins.
export const CRICKET_OUTCOMES: CricketOutcome[] = [
  { key: "W", label: "Wicket",  runs: 0, threshold: 0.10 },
  { key: "0", label: "Dot",     runs: 0, threshold: 0.35 },
  { key: "1", label: "Single",  runs: 1, threshold: 0.55 },
  { key: "2", label: "Double",  runs: 2, threshold: 0.68 },
  { key: "3", label: "Triple",  runs: 3, threshold: 0.75 },
  { key: "4", label: "Four",    runs: 4, threshold: 0.90 },
  { key: "6", label: "Six",     runs: 6, threshold: 1.00 },
];

export const CRICKET_MAX_BALLS = 36; // 6 overs
export const CRICKET_RUN_GROWTH = 0.06; // per-run compound step

export function cricketOutcomeForFloat(f: number): number {
  for (let i = 0; i < CRICKET_OUTCOMES.length; i++) {
    if (f < CRICKET_OUTCOMES[i].threshold) return i;
  }
  return CRICKET_OUTCOMES.length - 1;
}

export async function fairCricket(
  serverSeed: string, clientSeed: string, nonce: number, balls: number = CRICKET_MAX_BALLS,
): Promise<{ floats: number[]; outcomes: number[]; wicketBallIndex: number; totalRuns: number; grossMult: number }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, balls);
  const outcomes: number[] = [];
  let wicketBallIndex = -1;
  let totalRuns = 0;
  let grossMult = 1;
  for (let i = 0; i < floats.length; i++) {
    const idx = cricketOutcomeForFloat(floats[i]);
    outcomes.push(idx);
    const o = CRICKET_OUTCOMES[idx];
    if (o.key === "W") { wicketBallIndex = i; break; }
    if (o.runs > 0) {
      grossMult *= 1 + o.runs * CRICKET_RUN_GROWTH;
      totalRuns += o.runs;
    }
  }
  return { floats, outcomes, wicketBallIndex, totalRuns, grossMult: +grossMult.toFixed(4) };
}

/** Net mult applied at cash-out after edge. */
export function cricketNetMult(grossMult: number, edge: number): number {
  return +(grossMult * (1 - edge)).toFixed(4);
}


// ---- Ludo Dash · Race to 57 --------------------------------------------------
// Per-roll die (1..6) via floor(float × 6) + 1. Die=1 ⇒ snake bust.
// Die 2..5 advance by die value and compound mult by LUDO_STEP_MULT.
// Die=6 grants LUDO_SIX_MULT and grants a bonus advance (still consumes one roll).
// Reach 57 spaces ⇒ finish bonus LUDO_FINISH_MULT. Cash out any time (>1×).

export const LUDO_MAX_ROLLS = 24;
export const LUDO_TARGET_SPACES = 57;
export const LUDO_STEP_MULT = 1.15;
export const LUDO_SIX_MULT = 1.5;
export const LUDO_FINISH_MULT = 2.0;

export type LudoRoll = {
  die: number;         // 1..6
  isBust: boolean;     // die===1
  advance: number;     // spaces moved
  stepMult: number;    // mult applied this roll (1 if bust)
};

export function ludoRollForFloat(f: number): number {
  return Math.floor(f * 6) + 1; // 1..6
}

export async function fairLudo(
  serverSeed: string, clientSeed: string, nonce: number, maxRolls: number = LUDO_MAX_ROLLS,
): Promise<{ floats: number[]; rolls: LudoRoll[]; bustAt: number; finishedAt: number; totalSpaces: number; grossMult: number }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, maxRolls);
  const rolls: LudoRoll[] = [];
  let bustAt = -1;
  let finishedAt = -1;
  let totalSpaces = 0;
  let grossMult = 1;
  for (let i = 0; i < floats.length; i++) {
    const die = ludoRollForFloat(floats[i]);
    if (die === 1) {
      rolls.push({ die, isBust: true, advance: 0, stepMult: 1 });
      bustAt = i;
      break;
    }
    const stepMult = die === 6 ? LUDO_SIX_MULT : LUDO_STEP_MULT;
    grossMult *= stepMult;
    totalSpaces += die;
    rolls.push({ die, isBust: false, advance: die, stepMult });
    if (totalSpaces >= LUDO_TARGET_SPACES) {
      grossMult *= LUDO_FINISH_MULT;
      finishedAt = i;
      break;
    }
  }
  return { floats, rolls, bustAt, finishedAt, totalSpaces, grossMult: +grossMult.toFixed(4) };
}

export function ludoNetMult(grossMult: number, edge: number): number {
  return +(grossMult * (1 - edge)).toFixed(4);
}


// ---- Carrom Strike · Pocket King --------------------------------------------
// Sequential strikes; per-strike float mapped via ascending CDF.
// miss<0.35 ⇒ bust; white<0.65 ×1.20; coin<0.85 ×1.50; queen<0.96 ×1.90; king<1.00 ×3.00.
// Cash out any time after ≥1 pot. Max 15 strikes. EV<1 baseline, plus house edge at cashout.

export const CARROM_MAX_STRIKES = 15;

export type CarromOutcomeKey = "miss" | "white" | "coin" | "queen" | "king";

export type CarromOutcomeDef = {
  key: CarromOutcomeKey;
  label: string;
  emoji: string;
  cdf: number;   // upper bound on float
  mult: number;  // per-strike mult (0 = bust)
  isBust: boolean;
};

// Ordered by ascending CDF — used both for logic and paytable.
export const CARROM_OUTCOMES: CarromOutcomeDef[] = [
  { key: "miss",  label: "MISS",         emoji: "❌", cdf: 0.35, mult: 0.00, isBust: true  },
  { key: "white", label: "White Coin",   emoji: "⚪", cdf: 0.65, mult: 1.20, isBust: false },
  { key: "coin",  label: "Black Coin",   emoji: "⚫", cdf: 0.85, mult: 1.50, isBust: false },
  { key: "queen", label: "Queen",        emoji: "🔴", cdf: 0.96, mult: 1.90, isBust: false },
  { key: "king",  label: "Pocket KING",  emoji: "👑", cdf: 1.00, mult: 3.00, isBust: false },
];

export function carromOutcomeForFloat(f: number): CarromOutcomeDef {
  for (const o of CARROM_OUTCOMES) if (f < o.cdf) return o;
  return CARROM_OUTCOMES[CARROM_OUTCOMES.length - 1];
}

export type CarromStrike = {
  outcomeIndex: number; // index into CARROM_OUTCOMES
  mult: number;
  isBust: boolean;
};

export async function fairCarrom(
  serverSeed: string, clientSeed: string, nonce: number, maxStrikes: number = CARROM_MAX_STRIKES,
): Promise<{ floats: number[]; strikes: CarromStrike[]; bustAt: number; grossMult: number }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, maxStrikes);
  const strikes: CarromStrike[] = [];
  let bustAt = -1;
  let grossMult = 1;
  for (let i = 0; i < floats.length; i++) {
    const o = carromOutcomeForFloat(floats[i]);
    const idx = CARROM_OUTCOMES.indexOf(o);
    if (o.isBust) {
      strikes.push({ outcomeIndex: idx, mult: 0, isBust: true });
      bustAt = i;
      break;
    }
    grossMult *= o.mult;
    strikes.push({ outcomeIndex: idx, mult: o.mult, isBust: false });
  }
  return { floats, strikes, bustAt, grossMult: +grossMult.toFixed(4) };
}

export function carromNetMult(grossMult: number, edge: number): number {
  return +(grossMult * (1 - edge)).toFixed(4);
}


// ---- Fan-Tan · Bead Count ---------------------------------------------------
// Classic Macau/HK arcade: dealer scoops a pile of beads, counts them out in
// groups of 4, and the remainder (1..4) is the winning number. Player picks 1..4.
// Straight pick pays 4× (edge applied). We derive bead count from float1 in
// [FAN_TAN_MIN_BEADS..FAN_TAN_MAX_BEADS] purely for flavour; the winner is
// remainder mod 4 (mapping 0 ⇒ 4).

export const FAN_TAN_MIN_BEADS = 40;
export const FAN_TAN_MAX_BEADS = 120;
export const FAN_TAN_STRAIGHT_MULT = 4.0; // gross, edge applied on payout

export type FanTanPick = 1 | 2 | 3 | 4;

export function fanTanBeadCountForFloat(f: number): number {
  const span = FAN_TAN_MAX_BEADS - FAN_TAN_MIN_BEADS + 1;
  return FAN_TAN_MIN_BEADS + Math.floor(f * span);
}

export function fanTanWinnerForBeads(beads: number): FanTanPick {
  const rem = beads % 4;
  return (rem === 0 ? 4 : rem) as FanTanPick;
}

export async function fairFanTan(
  serverSeed: string, clientSeed: string, nonce: number,
): Promise<{ floats: number[]; beads: number; winner: FanTanPick; groups: number }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 1);
  const beads = fanTanBeadCountForFloat(floats[0]);
  const winner = fanTanWinnerForBeads(beads);
  const groups = Math.floor(beads / 4);
  return { floats, beads, winner, groups };
}

export function fanTanNetMult(win: boolean, edge: number): number {
  return win ? +(FAN_TAN_STRAIGHT_MULT * (1 - edge)).toFixed(4) : 0;
}


// ---- Balloon · Cash or Crash -----------------------------------------------
// Arcade crash variant. Each "pump" inflates the balloon and multiplies the
// cash-out by BALLOON_STEP. Every pump has an independent BALLOON_POP_CHANCE
// of popping. Provably fair: we consume up to BALLOON_MAX_PUMPS floats; the
// first float below BALLOON_POP_CHANCE marks the pop; if none pop, the
// balloon safely reaches max. On cashout before pop, payout = bet × step^k ×
// (1 − edge); a pop forfeits the stake.

export const BALLOON_MAX_PUMPS = 25;
export const BALLOON_POP_CHANCE = 0.09; // avg ~11 pumps before pop
export const BALLOON_STEP = 1.14;       // per-pump gross multiplier

export function balloonMultAt(pumps: number): number {
  if (pumps <= 0) return 1;
  return +Math.pow(BALLOON_STEP, pumps).toFixed(4);
}

export function balloonNetMult(grossMult: number, edge: number): number {
  return +(grossMult * (1 - edge)).toFixed(4);
}

export async function fairBalloon(
  serverSeed: string, clientSeed: string, nonce: number,
  maxPumps: number = BALLOON_MAX_PUMPS,
): Promise<{ floats: number[]; popAt: number; popMult: number }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, maxPumps);
  const { ratio } = getWinRateRatio("balloon");
  const popChance = Math.min(0.85, Math.max(0.01, BALLOON_POP_CHANCE / ratio));
  let popAt = -1;
  for (let i = 0; i < floats.length; i++) {
    if (floats[i] < popChance) { popAt = i; break; }
  }
  const popMult = popAt >= 0 ? balloonMultAt(popAt) : balloonMultAt(maxPumps);
  return { floats, popAt, popMult };
}


// ---- Dragon vs Phoenix · Battle Wheel --------------------------------------
// 25-segment battle wheel: 12 Dragon, 12 Phoenix, 1 Tie. Player picks one side.
// Segment index = floor(float × 25). Straight side gross ×(25/12); Tie ×25.
// Net = gross × (1 − edge). Loss forfeits stake.

export const DP_SEGMENTS = 25;
export const DP_DRAGON_COUNT = 12;
export const DP_PHOENIX_COUNT = 12;
export const DP_TIE_COUNT = 1;
export const DP_SIDE_GROSS = DP_SEGMENTS / DP_DRAGON_COUNT; // ≈ 2.0833
export const DP_TIE_GROSS = DP_SEGMENTS / DP_TIE_COUNT;     // 25

export type DPPick = "dragon" | "phoenix" | "tie";

export function dpSegmentForFloat(f: number): number {
  return Math.min(DP_SEGMENTS - 1, Math.max(0, Math.floor(f * DP_SEGMENTS)));
}

export function dpOutcomeForSegment(seg: number): DPPick {
  if (seg < DP_DRAGON_COUNT) return "dragon";
  if (seg < DP_DRAGON_COUNT + DP_PHOENIX_COUNT) return "phoenix";
  return "tie";
}

export async function fairDragonPhoenix(
  serverSeed: string, clientSeed: string, nonce: number,
): Promise<{ floats: number[]; segment: number; outcome: DPPick }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 1);
  const segment = dpSegmentForFloat(floats[0]);
  const outcome = dpOutcomeForSegment(segment);
  return { floats, segment, outcome };
}

export function dpNetMult(pick: DPPick, outcome: DPPick, edge: number): number {
  if (pick !== outcome) return 0;
  const gross = pick === "tie" ? DP_TIE_GROSS : DP_SIDE_GROSS;
  return +(gross * (1 - edge)).toFixed(4);
}


// ---- Wingo · 3-Minute Color+Number Lottery ---------------------------------
// BD/Asia lottery staple. Each round produces a number 0..9 derived from a
// single float. Colors: 1,3,7,9 = GREEN pure; 2,4,6,8 = RED pure; 0 = RED+VIOLET
// mixed; 5 = GREEN+VIOLET mixed. Size: 5..9 = BIG, 0..4 = SMALL.
//
// Bets & gross payouts (edge applied to net):
//   number straight ...... 9.0×
//   pure color hit ....... 2.0×  (green on 1/3/7/9 or red on 2/4/6/8)
//   mixed color hit ...... 1.5×  (green on 5, red on 0)
//   violet ............... 4.5×  (0 or 5)
//   big / small .......... 2.0×

export const WINGO_NUMBERS = 10;
export const WINGO_NUM_GROSS = 9.0;
export const WINGO_COLOR_PURE_GROSS = 2.0;
export const WINGO_COLOR_MIXED_GROSS = 1.5;
export const WINGO_VIOLET_GROSS = 4.5;
export const WINGO_SIZE_GROSS = 2.0;

export type WingoColor = "red" | "green" | "violet";
export type WingoSize = "big" | "small";
export type WingoPickKind = "num" | "color" | "violet" | "size";
export type WingoPick =
  | { kind: "num"; value: number }
  | { kind: "color"; value: "red" | "green" }
  | { kind: "violet" }
  | { kind: "size"; value: WingoSize };

export function wingoNumberForFloat(f: number): number {
  return Math.min(WINGO_NUMBERS - 1, Math.max(0, Math.floor(f * WINGO_NUMBERS)));
}

export function wingoColorsOf(n: number): WingoColor[] {
  if (n === 0) return ["red", "violet"];
  if (n === 5) return ["green", "violet"];
  return [n % 2 === 0 ? "red" : "green"];
}

export function wingoSizeOf(n: number): WingoSize {
  return n >= 5 ? "big" : "small";
}

export async function fairWingo(
  serverSeed: string, clientSeed: string, nonce: number,
): Promise<{ floats: number[]; number: number; colors: WingoColor[]; size: WingoSize }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 1);
  const number = wingoNumberForFloat(floats[0]);
  return { floats, number, colors: wingoColorsOf(number), size: wingoSizeOf(number) };
}

export function wingoNetMult(pick: WingoPick, n: number, edge: number): number {
  const apply = (g: number) => +(g * (1 - edge)).toFixed(4);
  switch (pick.kind) {
    case "num":
      return pick.value === n ? apply(WINGO_NUM_GROSS) : 0;
    case "color": {
      const cs = wingoColorsOf(n);
      if (!cs.includes(pick.value)) return 0;
      const mixed = cs.length > 1;
      return apply(mixed ? WINGO_COLOR_MIXED_GROSS : WINGO_COLOR_PURE_GROSS);
    }
    case "violet":
      return wingoColorsOf(n).includes("violet") ? apply(WINGO_VIOLET_GROSS) : 0;
    case "size":
      return wingoSizeOf(n) === pick.value ? apply(WINGO_SIZE_GROSS) : 0;
  }
}


// ---- Aviator X2 · Duo-Plane -------------------------------------------------
// Two independent crash planes fly side by side. Each plane's multiplier is
// derived from one float with the classic crash formula (3% instant bust to 1×).
// Bets:
//   LEFT   — wins if left plane's peak > right plane's peak. Gross ×1.97
//   RIGHT  — wins if right plane's peak > left plane's peak. Gross ×1.97
//   BOTH   — wins if BOTH planes reach at least AVX2_BOTH_THRESHOLD. Gross ×3.5
// Ties (equal peaks) resolve as loss for LEFT/RIGHT; BOTH is independent.

export const AVX2_SIDE_GROSS = 1.97;
export const AVX2_BOTH_GROSS = 3.5;
export const AVX2_BOTH_THRESHOLD = 2.0;

export type AvX2Pick = "left" | "right" | "both";

export async function fairAviatorX2(
  serverSeed: string, clientSeed: string, nonce: number, edge: number = 0.03,
): Promise<{ floats: number[]; left: number; right: number }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 2);
  const tune = getWinRateRatio("aviator-x2");
  const effEdge = tune.edge ?? edge;
  const bustProb = Math.min(0.95, Math.max(0.005, tune.ratio < 1 ? 0.03 + (1 - tune.ratio) * 0.5 : 0.03 / tune.ratio));
  const toMult = (f: number) => {
    if (f < bustProb) return 1.0;
    const m = Math.max(1, ((1 - effEdge) * tune.ratio) / Math.max(f, 1e-9));
    return +Math.min(m, 1_000_000).toFixed(2);
  };
  return { floats, left: toMult(floats[0]), right: toMult(floats[1]) };
}

export function avx2NetMult(pick: AvX2Pick, left: number, right: number, edge: number): number {
  const apply = (g: number) => +(g * (1 - edge)).toFixed(4);
  if (pick === "left") return left > right ? apply(AVX2_SIDE_GROSS) : 0;
  if (pick === "right") return right > left ? apply(AVX2_SIDE_GROSS) : 0;
  return left >= AVX2_BOTH_THRESHOLD && right >= AVX2_BOTH_THRESHOLD ? apply(AVX2_BOTH_GROSS) : 0;
}


// ---- Jhandi Munda · Crown & Anchor -----------------------------------------
// Classic South-Asian arcade dice: 6 dice, each face shows 1 of 6 symbols.
// Player picks a symbol; count matching dice. Payout = bet × (1 + count) if
// count > 0, else 0. (Traditional payout — house edge ~7.87% is baked in.)

export const JHANDI_SYMBOLS = ["🚩", "👑", "♥", "♠", "♦", "♣"] as const;
export type JhandiSymbol = (typeof JHANDI_SYMBOLS)[number];

export async function fairJhandi(
  serverSeed: string, clientSeed: string, nonce: number,
): Promise<{ floats: number[]; dice: number[]; symbols: JhandiSymbol[] }> {
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 6);
  const dice = floats.map((f) => Math.floor(f * 6) % 6);
  const symbols = dice.map((d) => JHANDI_SYMBOLS[d]);
  return { floats, dice, symbols };
}

export function jhandiCount(dice: number[], pickIdx: number): number {
  let n = 0;
  for (const d of dice) if (d === pickIdx) n++;
  return n;
}

export function jhandiNetMult(count: number): number {
  return count > 0 ? +(1 + count).toFixed(4) : 0;
}

// ---- JILI Super Ace · 5×4 · 1024 Ways Cascading Cards ------------------------
export type SuperAceSymbol =
  | "A"
  | "K"
  | "Q"
  | "J"
  | "S"
  | "H"
  | "D"
  | "C"
  | "SCATTER"
  | "LITTLE_JOKER"
  | "BIG_JOKER";

export type SuperAceCell = {
  id: string;
  sym: SuperAceSymbol;
  golden: boolean;
};

export type SuperAceWinLine = {
  symbol: SuperAceSymbol;
  matchReels: number;
  ways: number;
  payoutMult: number;
};

export type SuperAceCascadeStep = {
  comboIndex: number;
  gridBefore: SuperAceCell[][];
  winningPositions: [number, number][];
  winLines: SuperAceWinLine[];
  baseMult: number;
  comboMult: number;
  stepMult: number;
  convertedGolden: { col: number; row: number; to: "LITTLE_JOKER" | "BIG_JOKER" }[];
  clonedBigJokers: [number, number][];
  gridAfter: SuperAceCell[][];
};

export type SuperAceSpinResult = {
  initialGrid: SuperAceCell[][];
  cascades: SuperAceCascadeStep[];
  finalGrid: SuperAceCell[][];
  totalMultiplier: number;
  scatterCount: number;
  freeSpinsAwarded: number;
};

export const SUPER_ACE_REGULAR_SYMS = ["A", "K", "Q", "J", "S", "H", "D", "C"] as const;

export const SUPER_ACE_PAYTABLE: Record<
  (typeof SUPER_ACE_REGULAR_SYMS)[number],
  { 3: number; 4: number; 5: number }
> = {
  A: { 3: 0.5, 4: 1.5, 5: 2.5 },
  K: { 3: 0.4, 4: 1.2, 5: 2.0 },
  Q: { 3: 0.3, 4: 0.9, 5: 1.5 },
  J: { 3: 0.2, 4: 0.6, 5: 1.0 },
  S: { 3: 0.1, 4: 0.3, 5: 0.5 },
  H: { 3: 0.1, 4: 0.3, 5: 0.5 },
  D: { 3: 0.05, 4: 0.15, 5: 0.25 },
  C: { 3: 0.05, 4: 0.15, 5: 0.25 },
};

export const SUPER_ACE_BASE_COMBOS = [1, 2, 3, 5] as const;
export const SUPER_ACE_FREE_COMBOS = [2, 4, 6, 10] as const;

const SA_WEIGHTS: { sym: (typeof SUPER_ACE_REGULAR_SYMS)[number]; w: number }[] = [
  { sym: "A", w: 6 },
  { sym: "K", w: 8 },
  { sym: "Q", w: 10 },
  { sym: "J", w: 12 },
  { sym: "S", w: 15 },
  { sym: "H", w: 15 },
  { sym: "D", w: 18 },
  { sym: "C", w: 18 },
];
const SA_TOTAL_W = SA_WEIGHTS.reduce((s, x) => s + x.w, 0);

function pickSaRegular(f: number): (typeof SUPER_ACE_REGULAR_SYMS)[number] {
  let acc = f * SA_TOTAL_W;
  for (const item of SA_WEIGHTS) {
    acc -= item.w;
    if (acc <= 0) return item.sym;
  }
  return "C";
}

function isSaWild(sym: SuperAceSymbol) {
  return sym === "LITTLE_JOKER" || sym === "BIG_JOKER";
}

function cloneSaGrid(g: SuperAceCell[][]): SuperAceCell[][] {
  return g.map((col) => col.map((cell) => ({ ...cell })));
}

function evaluateSaGrid(grid: SuperAceCell[][]): {
  winningPositions: [number, number][];
  winLines: SuperAceWinLine[];
  baseMult: number;
} {
  const winMap = new Map<string, [number, number]>();
  const winLines: SuperAceWinLine[] = [];
  let baseMult = 0;

  for (const target of SUPER_ACE_REGULAR_SYMS) {
    const counts: number[] = [];
    const matchedPerCol: number[][] = [];
    for (let c = 0; c < 5; c++) {
      const rows: number[] = [];
      for (let r = 0; r < 4; r++) {
        const sym = grid[c][r].sym;
        if (sym === target || isSaWild(sym)) rows.push(r);
      }
      if (rows.length === 0) break;
      counts.push(rows.length);
      matchedPerCol.push(rows);
    }
    const matchReels = counts.length;
    if (matchReels >= 3) {
      // Ensure at least one actual symbol or wild pays only when reel 0 participates
      const ways = counts.reduce((p, n) => p * n, 1);
      const unit = SUPER_ACE_PAYTABLE[target][matchReels as 3 | 4 | 5];
      const payoutMult = +(ways * unit).toFixed(4);
      baseMult += payoutMult;
      winLines.push({ symbol: target, matchReels, ways, payoutMult });
      for (let c = 0; c < matchReels; c++) {
        for (const r of matchedPerCol[c]) {
          winMap.set(`${c}-${r}`, [c, r]);
        }
      }
    }
  }

  return {
    winningPositions: Array.from(winMap.values()),
    winLines,
    baseMult: +baseMult.toFixed(4),
  };
}

export async function fairSuperAceSpin(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  options?: { isFreeSpin?: boolean; edge?: number; winRatePct?: number },
): Promise<SuperAceSpinResult> {
  const isFreeSpin = !!options?.isFreeSpin;
  const tune = getWinRateRatio("super-ace");
  const ratio =
    options?.winRatePct !== undefined
      ? Math.min(1.95, Math.max(0.05, options.winRatePct / 50))
      : tune.ratio;
  const effEdge = options?.edge ?? tune.edge ?? 0.03;
  // Pre-draw generous deterministic floats for initial grid + up to 12 cascades
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 220);
  let fi = 0;
  const nextF = () => floats[fi++ % floats.length];
  let uid = 0;

  const goldRate = isFreeSpin ? 0.25 : 0.18;
  const scatterRate = isFreeSpin ? 0.025 : 0.032;

  const makeCell = (col: number, colHasScatter: boolean): SuperAceCell => {
    const fSym = nextF();
    const fMeta = nextF();
    if (!colHasScatter && fSym < scatterRate) {
      return { id: `sa-${nonce}-${uid++}`, sym: "SCATTER", golden: false };
    }
    const sym = pickSaRegular(fSym);
    const canGold = col >= 1 && col <= 3;
    const golden = canGold && fMeta < goldRate;
    return { id: `sa-${nonce}-${uid++}`, sym, golden };
  };

  // Build 5 columns × 4 rows (row 0 top, row 3 bottom)
  const initialGrid: SuperAceCell[][] = [];
  for (let c = 0; c < 5; c++) {
    const col: SuperAceCell[] = [];
    let hasScatter = false;
    for (let r = 0; r < 4; r++) {
      const cell = makeCell(c, hasScatter);
      if (cell.sym === "SCATTER") hasScatter = true;
      col.push(cell);
    }
    initialGrid.push(col);
  }

  let curGrid = cloneSaGrid(initialGrid);
  const cascades: SuperAceCascadeStep[] = [];
  const ladders = isFreeSpin ? SUPER_ACE_FREE_COMBOS : SUPER_ACE_BASE_COMBOS;
  let totalMultiplier = 0;

  for (let stepIdx = 0; stepIdx < 12; stepIdx++) {
    const evalRes = evaluateSaGrid(curGrid);
    if (evalRes.winningPositions.length === 0) break;

    const comboMult = ladders[Math.min(stepIdx, ladders.length - 1)];
    const rawStepMult = evalRes.baseMult * comboMult * (1 - effEdge) * ratio;
    const stepMult = +Math.min(rawStepMult, 10_000).toFixed(4);
    totalMultiplier = +Math.min(totalMultiplier + stepMult, 10_000).toFixed(4);

    const winKeySet = new Set(evalRes.winningPositions.map(([c, r]) => `${c}-${r}`));
    const convertedGolden: SuperAceCascadeStep["convertedGolden"] = [];
    const clonedBigJokers: [number, number][] = [];

    const working = cloneSaGrid(curGrid);
    // 1) Process winning cells: Golden cards flip into Little/Big Joker; regular/used wilds are cleared
    const convertedSet = new Set<string>();
    const bigJokerOrigins: [number, number][] = [];

    for (const [c, r] of evalRes.winningPositions) {
      const cell = working[c][r];
      if (cell.golden && !isSaWild(cell.sym)) {
        const fJ = nextF();
        const jokerType: "LITTLE_JOKER" | "BIG_JOKER" = fJ < 0.22 ? "BIG_JOKER" : "LITTLE_JOKER";
        working[c][r] = { id: `${cell.id}-j`, sym: jokerType, golden: false };
        convertedGolden.push({ col: c, row: r, to: jokerType });
        convertedSet.add(`${c}-${r}`);
        if (jokerType === "BIG_JOKER") bigJokerOrigins.push([c, r]);
      }
    }

    // 2) Big Joker clones itself onto 1-2 non-winning, non-scatter cells on reels 1-3
    if (bigJokerOrigins.length > 0) {
      const candidates: [number, number][] = [];
      for (let c = 1; c <= 3; c++) {
        for (let r = 0; r < 4; r++) {
          const k = `${c}-${r}`;
          if (!winKeySet.has(k) && !convertedSet.has(k) && working[c][r].sym !== "SCATTER" && !isSaWild(working[c][r].sym)) {
            candidates.push([c, r]);
          }
        }
      }
      const copyCount = Math.min(candidates.length, 1 + Math.floor(nextF() * 2));
      for (let i = 0; i < copyCount && candidates.length > 0; i++) {
        const pickIdx = Math.floor(nextF() * candidates.length) % candidates.length;
        const [tc, tr] = candidates.splice(pickIdx, 1)[0];
        working[tc][tr] = { id: `sa-bj-${nonce}-${uid++}`, sym: "BIG_JOKER", golden: false };
        clonedBigJokers.push([tc, tr]);
      }
    }

    // 3) Remove eliminated cells (winning positions that weren't turned into a Joker) & drop remaining down
    const afterGrid: SuperAceCell[][] = [];
    for (let c = 0; c < 5; c++) {
      const survivors: SuperAceCell[] = [];
      let colHasScatter = false;
      for (let r = 0; r < 4; r++) {
        const k = `${c}-${r}`;
        const eliminated = winKeySet.has(k) && !convertedSet.has(k);
        if (!eliminated) {
          if (working[c][r].sym === "SCATTER") colHasScatter = true;
          survivors.push(working[c][r]);
        }
      }
      const needed = 4 - survivors.length;
      const refills: SuperAceCell[] = [];
      for (let k = 0; k < needed; k++) {
        const nc = makeCell(c, colHasScatter);
        if (nc.sym === "SCATTER") colHasScatter = true;
        refills.push(nc);
      }
      afterGrid.push([...refills, ...survivors]);
    }

    cascades.push({
      comboIndex: stepIdx + 1,
      gridBefore: cloneSaGrid(curGrid),
      winningPositions: evalRes.winningPositions,
      winLines: evalRes.winLines,
      baseMult: evalRes.baseMult,
      comboMult,
      stepMult,
      convertedGolden,
      clonedBigJokers,
      gridAfter: cloneSaGrid(afterGrid),
    });

    curGrid = afterGrid;
  }

  let scatterCount = 0;
  for (let c = 0; c < 5; c++) {
    for (let r = 0; r < 4; r++) {
      if (curGrid[c][r].sym === "SCATTER") scatterCount++;
    }
  }
  const freeSpinsAwarded = scatterCount >= 3 ? (isFreeSpin ? 5 : 10) : 0;

  return {
    initialGrid,
    cascades,
    finalGrid: curGrid,
    totalMultiplier,
    scatterCount,
    freeSpinsAwarded,
  };
}

// ---- JILI Fortune Gems 2 · 3×3 + 4th Special Wheel Reel · 5 Paylines ---------
export type Fg2Symbol = "WILD" | "RED" | "BLUE" | "GREEN" | "A" | "K" | "Q" | "J";
export type Fg2SpecialItem = 1 | 2 | 3 | 5 | 10 | 15 | "WHEEL";

// Multiplier of BASE bet for 3 matching on a payline (verified live at Bet 400)
export const FG2_PAYTABLE: Record<Fg2Symbol, number> = {
  WILD: 5.0,
  RED: 4.0,
  BLUE: 3.0,
  GREEN: 2.4,
  A: 2.0,
  K: 1.6,
  Q: 1.0,
  J: 0.4,
};

// 5 fixed paylines: [rowCol0, rowCol1, rowCol2]
export const FG2_PAYLINES: readonly [number, number, number][] = [
  [1, 1, 1], // Middle
  [0, 0, 0], // Top
  [2, 2, 2], // Bottom
  [0, 1, 2], // Diagonal ↘
  [2, 1, 0], // Diagonal ↗
];

export type Fg2WinLine = {
  lineIndex: number;
  symbol: Fg2Symbol;
  lineMult: number;
};

export type Fg2SpinResult = {
  grid: Fg2Symbol[][]; // [col 0..2][row 0..2]
  specialReel: [Fg2SpecialItem, Fg2SpecialItem, Fg2SpecialItem]; // top, center, bottom
  centerSpecial: Fg2SpecialItem;
  winLines: Fg2WinLine[];
  baseLineMult: number;
  reel4Mult: number;
  wheelTriggered: boolean;
  wheelPrizeMult: number;
  wheelExtraMult: number;
  totalBaseBetMult: number; // total win as multiple of normal base bet
};

const FG2_SYM_WEIGHTS: { sym: Fg2Symbol; w: number }[] = [
  { sym: "WILD", w: 6 },
  { sym: "RED", w: 8 },
  { sym: "BLUE", w: 10 },
  { sym: "GREEN", w: 12 },
  { sym: "A", w: 14 },
  { sym: "K", w: 16 },
  { sym: "Q", w: 18 },
  { sym: "J", w: 20 },
];
const FG2_SYM_TOTAL = FG2_SYM_WEIGHTS.reduce((s, x) => s + x.w, 0);

function pickFg2Symbol(f: number): Fg2Symbol {
  let acc = f * FG2_SYM_TOTAL;
  for (const item of FG2_SYM_WEIGHTS) {
    acc -= item.w;
    if (acc <= 0) return item.sym;
  }
  return "J";
}

function pickFg2Special(f: number, extraBet: boolean): Fg2SpecialItem {
  const pool: { item: Fg2SpecialItem; w: number }[] = extraBet
    ? [
        { item: 2, w: 32 },
        { item: 3, w: 26 },
        { item: 5, w: 18 },
        { item: 10, w: 9 },
        { item: 15, w: 5 },
        { item: "WHEEL", w: 10 },
      ]
    : [
        { item: 1, w: 34 },
        { item: 2, w: 25 },
        { item: 3, w: 18 },
        { item: 5, w: 11 },
        { item: 10, w: 4 },
        { item: 15, w: 2 },
        { item: "WHEEL", w: 6 },
      ];
  const total = pool.reduce((s, x) => s + x.w, 0);
  let acc = f * total;
  for (const p of pool) {
    acc -= p.w;
    if (acc <= 0) return p.item;
  }
  return extraBet ? 2 : 1;
}

const WHEEL_WEIGHTS: { mult: number; w: number }[] = [
  { mult: 1, w: 18 },
  { mult: 3, w: 22 },
  { mult: 5, w: 18 },
  { mult: 8, w: 14 },
  { mult: 10, w: 10 },
  { mult: 15, w: 7 },
  { mult: 20, w: 5 },
  { mult: 30, w: 3 },
  { mult: 50, w: 1.5 },
  { mult: 100, w: 0.9 },
  { mult: 200, w: 0.45 },
  { mult: 1000, w: 0.15 },
];
const WHEEL_TOTAL_W = WHEEL_WEIGHTS.reduce((s, x) => s + x.w, 0);

function pickWheelPrize(f: number): number {
  let acc = f * WHEEL_TOTAL_W;
  for (const x of WHEEL_WEIGHTS) {
    acc -= x.w;
    if (acc <= 0) return x.mult;
  }
  return 3;
}

export async function fairFortuneGems2Spin(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  options?: { extraBet?: boolean; edge?: number; winRatePct?: number },
): Promise<Fg2SpinResult> {
  const extraBet = !!options?.extraBet;
  const tune = getWinRateRatio("fortune-gems-2");
  const ratio =
    options?.winRatePct !== undefined
      ? Math.min(1.95, Math.max(0.05, options.winRatePct / 50))
      : tune.ratio;
  const effEdge = options?.edge ?? tune.edge ?? 0.03;
  const floats = await fairFloats(serverSeed, clientSeed, nonce, 18);
  let fi = 0;
  const nextF = () => floats[fi++ % floats.length];

  // Build 3×3 grid with natural stacked affinity like live JILI Fortune Gems 2
  const grid: Fg2Symbol[][] = [];
  for (let c = 0; c < 3; c++) {
    const col: Fg2Symbol[] = [];
    let anchor: Fg2Symbol | null = null;
    for (let r = 0; r < 3; r++) {
      const f = nextF();
      const stackF = nextF();
      if (anchor && stackF < 0.36) {
        col.push(anchor);
      } else {
        const s = pickFg2Symbol(f);
        if (!anchor) anchor = s;
        col.push(s);
      }
    }
    grid.push(col);
  }

  const specialReel: [Fg2SpecialItem, Fg2SpecialItem, Fg2SpecialItem] = [
    pickFg2Special(nextF(), extraBet),
    pickFg2Special(nextF(), extraBet),
    pickFg2Special(nextF(), extraBet),
  ];
  const centerSpecial = specialReel[1];

  // Evaluate all 5 fixed paylines
  const winLines: Fg2WinLine[] = [];
  let baseLineMult = 0;

  FG2_PAYLINES.forEach((rows, lineIndex) => {
    const syms: Fg2Symbol[] = [grid[0][rows[0]], grid[1][rows[1]], grid[2][rows[2]]];
    let target: Fg2Symbol = "WILD";
    for (const s of syms) {
      if (s !== "WILD") {
        target = s;
        break;
      }
    }
    const allMatch = syms.every((s) => s === target || s === "WILD");
    if (allMatch) {
      const lineMult = FG2_PAYTABLE[target];
      baseLineMult = +(baseLineMult + lineMult).toFixed(4);
      winLines.push({ lineIndex, symbol: target, lineMult });
    }
  });

  const wheelTriggered = centerSpecial === "WHEEL" && winLines.length > 0;
  const reel4Mult = typeof centerSpecial === "number" ? centerSpecial : 1;

  let wheelPrizeMult = 0;
  let wheelExtraMult = 1;
  if (wheelTriggered) {
    wheelPrizeMult = pickWheelPrize(nextF());
    if (extraBet) {
      const exPool = [1, 2, 3, 5, 10, 15];
      wheelExtraMult = exPool[Math.floor(nextF() * exPool.length) % exPool.length];
    }
  }

  const rawMult = baseLineMult * reel4Mult + wheelPrizeMult * wheelExtraMult;
  const maxCap = extraBet ? 15_000 : 10_000;
  const totalBaseBetMult =
    rawMult > 0
      ? +Math.min(maxCap, rawMult * (1 - effEdge) * ratio).toFixed(4)
      : 0;

  return {
    grid,
    specialReel,
    centerSpecial,
    winLines,
    baseLineMult,
    reel4Mult,
    wheelTriggered,
    wheelPrizeMult,
    wheelExtraMult,
    totalBaseBetMult,
  };
}







// ---- Seed generation ---------------------------------------------------------







// ---- Seed generation ---------------------------------------------------------


export function randomSeed(bytes: number = 32): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return toHex(b.buffer);
}


