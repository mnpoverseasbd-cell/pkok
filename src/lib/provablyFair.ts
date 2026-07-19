// Provably Fair — Stake-style HMAC-SHA256 based outcome generation.
// Deterministic: given (serverSeed, clientSeed, nonce, cursor) → same float.
// Anyone can verify a past bet after the server seed is revealed.

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
export async function fairDice(serverSeed: string, clientSeed: string, nonce: number) {
  const [f] = await fairFloats(serverSeed, clientSeed, nonce, 1);
  return +(f * 100).toFixed(2);
}

/** Limbo: crash-style multiplier. `edge` in [0,1). */
export async function fairLimbo(
  serverSeed: string, clientSeed: string, nonce: number, edge: number = 0.01,
) {
  const [f] = await fairFloats(serverSeed, clientSeed, nonce, 1);
  // Standard Stake formula: mult = floor((1e8 * (1-edge)) / (f * 1e8)) / 100 style,
  // simplified to keep floats: (1 - edge) / f, clamped ≥ 1.
  const m = Math.max(1, (1 - edge) / Math.max(f, 1e-9));
  return +Math.min(m, 1_000_000).toFixed(2);
}

/** Crash: same formula as Limbo but with a 1/N instant-bust chance. */
export async function fairCrash(
  serverSeed: string, clientSeed: string, nonce: number, edge: number = 0.01,
) {
  const [f] = await fairFloats(serverSeed, clientSeed, nonce, 1);
  // 3% instant bust — matches original nextCrash behavior
  if (f < 0.03) return 1.0;
  const m = Math.max(1, (1 - edge) / Math.max(f, 1e-9));
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


// ---- Seed generation ---------------------------------------------------------

export function randomSeed(bytes: number = 32): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return toHex(b.buffer);
}
