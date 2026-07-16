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

// ---- Seed generation ---------------------------------------------------------

export function randomSeed(bytes: number = 32): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return toHex(b.buffer);
}
