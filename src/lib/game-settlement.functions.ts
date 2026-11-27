import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  fairCrash,
  fairDice,
  fairFortuneGems2Spin,
  fairSuperAceSpin,
  randomSeed,
  sha256Hex,
  type SuperAceSpinResult,
} from "@/lib/provablyFair";

function getServiceKey(): string {
  const key = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Server configuration missing");
  return key;
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = getServiceKey();
  if (!url) throw new Error("Server configuration missing");
  const isNewKey = key.startsWith("sb_publishable_") || key.startsWith("sb_secret_");
  return import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input: any, init: any) => {
          const headers = new Headers(init?.headers);
          if (isNewKey && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    }),
  );
}

type GameCfg = {
  is_enabled: boolean;
  min_bet: number;
  max_bet: number;
  house_edge: number;
  win_rate_pct: number;
  payout_multiplier: number;
  max_payout_mult: number;
};

async function readServerGameConfig(admin: any, gameKey: string): Promise<GameCfg> {
  const { data, error } = await admin
    .from("game_configs")
    .select("is_enabled, min_bet, max_bet, house_edge, config")
    .eq("game_key", gameKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const c = (data?.config as Record<string, unknown>) ?? {};
  const cfg: GameCfg = {
    is_enabled: data ? Boolean(data.is_enabled) : true,
    min_bet: Number(data?.min_bet ?? 10),
    max_bet: Number(data?.max_bet ?? 10000),
    house_edge: Number(data?.house_edge ?? 0.04),
    win_rate_pct: Number(c.win_rate_pct ?? 50),
    payout_multiplier: Number(c.payout_multiplier ?? 1),
    max_payout_mult: Number(c.max_payout_mult ?? 0),
  };
  if (!cfg.is_enabled) {
    throw new Error("এই গেমটি বর্তমানে বন্ধ আছে");
  }
  return cfg;
}

function newRoundId(prefix: string): string {
  const rand = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${rand}`;
}

async function debitWalletAtomic(
  admin: any,
  userId: string,
  amount: number,
  gameId: string,
  roundId: string,
  note: string,
): Promise<number> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("অবৈধ বাজির পরিমাণ");
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: prof, error: pErr } = await admin
      .from("profiles")
      .select("wallet_balance")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!prof) throw new Error("ব্যবহারকারীর প্রোফাইল পাওয়া যায়নি");
    const cur = Number(prof.wallet_balance ?? 0);
    if (!Number.isFinite(cur) || cur < amount) {
      throw new Error("পর্যাপ্ত ব্যালেন্স নেই");
    }
    const next = Math.round((cur - amount) * 100) / 100;
    const { data: updated, error: uErr } = await admin
      .from("profiles")
      .update({ wallet_balance: next })
      .eq("id", userId)
      .eq("wallet_balance", cur)
      .select("wallet_balance")
      .maybeSingle();
    if (uErr) throw new Error(uErr.message);
    if (updated) {
      await admin.from("transactions").insert({
        user_id: userId,
        type: "bet",
        status: "approved",
        amount,
        game_id: gameId,
        round_id: roundId,
        user_note: note,
        approved_at: new Date().toISOString(),
      });
      return Number(updated.wallet_balance);
    }
  }
  throw new Error("ব্যালেন্স আপডেটে সমস্যা হয়েছে, আবার চেষ্টা করুন");
}

async function creditWalletAtomic(
  admin: any,
  userId: string,
  amount: number,
  gameId: string,
  roundId: string,
  note: string,
): Promise<number | null> {
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // Replay guard: do not pay the same win round_id twice
  const { data: existing } = await admin
    .from("transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("round_id", roundId)
    .eq("type", "win")
    .limit(1);
  if (existing && existing.length > 0) {
    throw new Error("এই রাউন্ডের পুরস্কার ইতোমধ্যেই যোগ হয়েছে");
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: prof, error: pErr } = await admin
      .from("profiles")
      .select("wallet_balance")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!prof) throw new Error("ব্যবহারকারীর প্রোফাইল পাওয়া যায়নি");
    const cur = Number(prof.wallet_balance ?? 0);
    const next = Math.round((cur + amount) * 100) / 100;
    const { data: updated, error: uErr } = await admin
      .from("profiles")
      .update({ wallet_balance: next })
      .eq("id", userId)
      .eq("wallet_balance", cur)
      .select("wallet_balance")
      .maybeSingle();
    if (uErr) throw new Error(uErr.message);
    if (updated) {
      await admin.from("transactions").insert({
        user_id: userId,
        type: "win",
        status: "approved",
        amount,
        game_id: gameId,
        round_id: roundId,
        user_note: note,
        approved_at: new Date().toISOString(),
      });
      return Number(updated.wallet_balance);
    }
  }
  throw new Error("জয়ের টাকা যোগ করতে ব্যর্থ হয়েছে");
}

async function readBalance(admin: any, userId: string): Promise<number> {
  const { data } = await admin.from("profiles").select("wallet_balance").eq("id", userId).maybeSingle();
  return Number(data?.wallet_balance ?? 0);
}

function b64UrlEncode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const raw = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function deriveAesKey(): Promise<CryptoKey> {
  const secretBytes = new TextEncoder().encode(getServiceKey());
  const hash = await crypto.subtle.digest("SHA-256", secretBytes);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function sealTicket(payload: unknown): Promise<string> {
  const key = await deriveAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const pt = new TextEncoder().encode(JSON.stringify(payload));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, pt));
  return `${b64UrlEncode(iv)}.${b64UrlEncode(ct)}`;
}

async function unsealTicket<T>(token: string): Promise<T> {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid round ticket");
  const key = await deriveAesKey();
  const iv = b64UrlDecode(parts[0]);
  const ct = b64UrlDecode(parts[1]);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(pt)) as T;
}

// ============================================================================
// 1. Lucky Dice — Server-Verified Settlement
// ============================================================================
export const serverPlayDice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        bet: z.number().positive(),
        target: z.number().min(2).max(98),
        direction: z.enum(["under", "over"]),
        clientSeed: z.string().max(128).optional(),
        nonce: z.number().int().min(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await getAdminClient();
    const cfg = await readServerGameConfig(admin, "dice");
    const bet = Math.round(data.bet * 100) / 100;
    if (bet < cfg.min_bet) throw new Error(`সর্বনিম্ন বাজি ৳${cfg.min_bet}`);
    if (bet > cfg.max_bet) throw new Error(`সর্বোচ্চ বাজি ৳${cfg.max_bet}`);

    const roundId = newRoundId("dice");
    let balance = await debitWalletAtomic(
      admin,
      context.userId,
      bet,
      "dice",
      roundId,
      `Dice ${data.direction} ${data.target}`,
    );

    const serverSeed = randomSeed();
    const serverSeedHash = await sha256Hex(serverSeed);
    const clientSeed = data.clientSeed || randomSeed(8);
    const nonce = data.nonce ?? 0;

    const roll = await fairDice(serverSeed, clientSeed, nonce, { winRatePct: cfg.win_rate_pct });
    const winChance = Math.min(98, Math.max(2, data.direction === "under" ? data.target : 100 - data.target));
    const basePayout = +(99 / winChance).toFixed(4);
    const isWin = data.direction === "under" ? roll < data.target : roll > data.target;

    let won = 0;
    let mult = 0;
    if (isWin) {
      const rawWon = Math.floor(bet * basePayout * (1 - cfg.house_edge));
      const scale = Number.isFinite(cfg.payout_multiplier) && cfg.payout_multiplier > 0 ? cfg.payout_multiplier : 1;
      const cap = Number.isFinite(cfg.max_payout_mult) && cfg.max_payout_mult > 0 ? cfg.max_payout_mult : Infinity;
      won = Math.min(Math.floor(rawWon * scale), Math.floor(bet * cap));
      if (won > 0) {
        mult = +(won / bet).toFixed(2);
        const nb = await creditWalletAtomic(admin, context.userId, won, "dice", roundId, `Dice win ${mult}x`);
        if (nb !== null) balance = nb;
      }
    }

    return {
      roll,
      isWin,
      won,
      mult,
      pnl: +(won - bet).toFixed(2),
      newBalance: balance,
      serverSeed,
      serverSeedHash,
    };
  });

// ============================================================================
// 2. Aviator Crash — Sealed AES-256-GCM Flight & Server Cashout
// ============================================================================
type CrashTicketPayload = {
  roundId: string;
  userId: string;
  crashAt: number;
  startedAtMs: number;
  bets: { slotIndex: 0 | 1; amount: number }[];
  houseEdge: number;
  multScale: number;
  maxCapMult: number;
  serverSeed: string;
};

export const serverCrashStart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        bets: z
          .array(z.object({ slotIndex: z.union([z.literal(0), z.literal(1)]), amount: z.number().positive() }))
          .min(1)
          .max(2),
        clientSeed: z.string().max(128).optional(),
        nonce: z.number().int().min(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await getAdminClient();
    const cfg = await readServerGameConfig(admin, "crash");
    const uniqueSlots = new Set(data.bets.map((b) => b.slotIndex));
    if (uniqueSlots.size !== data.bets.length) throw new Error("Duplicate bet slot");

    let totalBet = 0;
    for (const b of data.bets) {
      if (b.amount < cfg.min_bet) throw new Error(`সর্বনিম্ন বাজি ৳${cfg.min_bet}`);
      if (b.amount > cfg.max_bet) throw new Error(`সর্বোচ্চ বাজি ৳${cfg.max_bet}`);
      totalBet += b.amount;
    }
    totalBet = Math.round(totalBet * 100) / 100;

    const roundId = newRoundId("crash");
    const newBalance = await debitWalletAtomic(
      admin,
      context.userId,
      totalBet,
      "crash",
      roundId,
      `Aviator flight (${data.bets.map((b) => `S${b.slotIndex + 1}:৳${b.amount}`).join(", ")})`,
    );

    const serverSeed = randomSeed();
    const serverSeedHash = await sha256Hex(serverSeed);
    const clientSeed = data.clientSeed || randomSeed(8);
    const nonce = data.nonce ?? 0;

    const crashAt = await fairCrash(serverSeed, clientSeed, nonce, cfg.house_edge, {
      winRatePct: cfg.win_rate_pct,
    });

    const ticket: CrashTicketPayload = {
      roundId,
      userId: context.userId,
      crashAt,
      startedAtMs: Date.now(),
      bets: data.bets,
      houseEdge: cfg.house_edge,
      multScale: Number.isFinite(cfg.payout_multiplier) && cfg.payout_multiplier > 0 ? cfg.payout_multiplier : 1,
      maxCapMult: Number.isFinite(cfg.max_payout_mult) && cfg.max_payout_mult > 0 ? cfg.max_payout_mult : 0,
      serverSeed,
    };
    const roundToken = await sealTicket(ticket);

    return { roundToken, roundId, newBalance, serverSeedHash };
  });

export const serverCrashCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ roundToken: z.string().min(10) }).parse(input))
  .handler(async ({ data, context }) => {
    const ticket = await unsealTicket<CrashTicketPayload>(data.roundToken);
    if (ticket.userId !== context.userId) throw new Error("Unauthorized round ticket");

    const elapsed = Math.max(0, (Date.now() - ticket.startedAtMs) / 1000);
    const liveMult = +Math.exp(0.15 * elapsed).toFixed(2);
    if (liveMult >= ticket.crashAt) {
      return {
        crashed: true as const,
        crashAt: ticket.crashAt,
        serverMult: ticket.crashAt,
        serverSeed: ticket.serverSeed,
      };
    }
    return {
      crashed: false as const,
      crashAt: null,
      serverMult: liveMult,
      serverSeed: null,
    };
  });

export const serverCrashCashout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        roundToken: z.string().min(10),
        slotIndex: z.union([z.literal(0), z.literal(1)]),
        autoMult: z.number().min(1.01).max(100000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ticket = await unsealTicket<CrashTicketPayload>(data.roundToken);
    if (ticket.userId !== context.userId) throw new Error("Unauthorized round ticket");
    const slotBet = ticket.bets.find((b) => b.slotIndex === data.slotIndex);
    if (!slotBet) throw new Error("Slot has no active bet in this round");

    const elapsed = Math.max(0, (Date.now() - ticket.startedAtMs) / 1000);
    const liveMult = +Math.exp(0.15 * elapsed).toFixed(2);

    let cashMult: number;
    if (data.autoMult !== undefined) {
      if (data.autoMult >= ticket.crashAt || liveMult + 0.08 < data.autoMult) {
        return { ok: false as const, crashed: true, crashAt: ticket.crashAt };
      }
      cashMult = +data.autoMult.toFixed(2);
    } else {
      if (liveMult >= ticket.crashAt) {
        return { ok: false as const, crashed: true, crashAt: ticket.crashAt };
      }
      cashMult = +Math.max(1.01, Math.min(liveMult, +(ticket.crashAt - 0.01).toFixed(2))).toFixed(2);
    }

    const admin = await getAdminClient();
    const rawWon = Math.floor(slotBet.amount * cashMult * (1 - ticket.houseEdge));
    const cap = ticket.maxCapMult > 0 ? Math.floor(slotBet.amount * ticket.maxCapMult) : Infinity;
    const payout = Math.max(1, Math.min(Math.floor(rawWon * ticket.multScale), cap));

    const cashRoundId = `${ticket.roundId}-cash-${data.slotIndex}`;
    const nb = await creditWalletAtomic(
      admin,
      context.userId,
      payout,
      "crash",
      cashRoundId,
      `Aviator cashout @ ${cashMult}x`,
    );
    const newBalance = nb ?? (await readBalance(admin, context.userId));

    return {
      ok: true as const,
      crashed: false,
      cashMult,
      payout,
      newBalance,
    };
  });

// ============================================================================
// 3. Super Ace — Server-Verified Spin + Pre-Settled Free Spins
// ============================================================================
export const serverPlaySuperAce = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        bet: z.number().positive(),
        buyBonus: z.boolean().optional(),
        clientSeed: z.string().max(128).optional(),
        nonce: z.number().int().min(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await getAdminClient();
    const cfg = await readServerGameConfig(admin, "super-ace");
    const baseBet = Math.round(data.bet * 100) / 100;
    const stake = data.buyBonus ? Math.round(baseBet * 40.5 * 100) / 100 : baseBet;

    if (baseBet < cfg.min_bet) throw new Error(`সর্বনিম্ন বাজি ৳${cfg.min_bet}`);
    if (stake > cfg.max_bet) throw new Error(`সর্বোচ্চ বাজি ৳${cfg.max_bet}`);

    const roundId = newRoundId("superace");
    let balance = await debitWalletAtomic(
      admin,
      context.userId,
      stake,
      "super-ace",
      roundId,
      data.buyBonus ? `Super Ace Buy Bonus (bet ৳${baseBet})` : `Super Ace spin`,
    );

    const serverSeed = randomSeed();
    const serverSeedHash = await sha256Hex(serverSeed);
    const clientSeed = data.clientSeed || randomSeed(8);
    const baseNonce = data.nonce ?? 0;

    let baseSpin = await fairSuperAceSpin(serverSeed, clientSeed, baseNonce, {
      isFreeSpin: false,
      edge: cfg.house_edge,
      winRatePct: cfg.win_rate_pct,
    });

    if (data.buyBonus && baseSpin.freeSpinsAwarded === 0) {
      const patchedInit = baseSpin.initialGrid.map((col) => col.map((cell) => ({ ...cell })));
      patchedInit[0][1] = { id: `bb-s0-${baseNonce}`, sym: "SCATTER", golden: false };
      patchedInit[2][2] = { id: `bb-s2-${baseNonce}`, sym: "SCATTER", golden: false };
      patchedInit[4][1] = { id: `bb-s4-${baseNonce}`, sym: "SCATTER", golden: false };
      baseSpin = {
        ...baseSpin,
        initialGrid: patchedInit,
        finalGrid: patchedInit,
        cascades: [],
        totalMultiplier: 0,
        scatterCount: 3,
        freeSpinsAwarded: 10,
      };
    }

    const freeSpins: SuperAceSpinResult[] = [];
    let spinsRemaining = baseSpin.freeSpinsAwarded;
    let fsStep = 0;
    while (spinsRemaining > 0 && fsStep < 30) {
      spinsRemaining--;
      fsStep++;
      const fsRes = await fairSuperAceSpin(serverSeed, clientSeed, baseNonce + fsStep, {
        isFreeSpin: true,
        edge: cfg.house_edge,
        winRatePct: cfg.win_rate_pct,
      });
      freeSpins.push(fsRes);
      if (fsRes.freeSpinsAwarded > 0) {
        spinsRemaining = Math.min(30 - fsStep, spinsRemaining + fsRes.freeSpinsAwarded);
      }
    }

    const scale = Number.isFinite(cfg.payout_multiplier) && cfg.payout_multiplier > 0 ? cfg.payout_multiplier : 1;
    const cap = Number.isFinite(cfg.max_payout_mult) && cfg.max_payout_mult > 0 ? cfg.max_payout_mult : 10000;
    const rawTotalMult =
      baseSpin.totalMultiplier + freeSpins.reduce((acc, s) => acc + s.totalMultiplier, 0);
    const cappedTotalMult = Math.min(rawTotalMult * scale, cap);
    const totalWin = Math.round(baseBet * cappedTotalMult * 100) / 100;
    const baseWin = Math.round(baseBet * Math.min(baseSpin.totalMultiplier * scale, cap) * 100) / 100;

    if (totalWin > 0) {
      const nb = await creditWalletAtomic(
        admin,
        context.userId,
        totalWin,
        "super-ace",
        roundId,
        `Super Ace win (${freeSpins.length} FS)`,
      );
      if (nb !== null) balance = nb;
    }

    return {
      baseSpin,
      freeSpins,
      stake,
      baseWin,
      totalWin,
      newBalance: balance,
      serverSeed,
      serverSeedHash,
    };
  });

// ============================================================================
// 4. Fortune Gems 2 — Server-Verified 3×3 + Special Wheel + Extra Bet
// ============================================================================
export const serverPlayFortuneGems2 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        baseBet: z.number().positive(),
        extraBet: z.boolean(),
        clientSeed: z.string().max(128).optional(),
        nonce: z.number().int().min(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await getAdminClient();
    const cfg = await readServerGameConfig(admin, "fortune-gems-2");
    const baseBet = Math.round(data.baseBet * 100) / 100;
    const stake = Math.round(baseBet * (data.extraBet ? 1.5 : 1) * 100) / 100;

    if (stake < cfg.min_bet) throw new Error(`সর্বনিম্ন বাজি ৳${cfg.min_bet}`);
    if (stake > cfg.max_bet) throw new Error(`সর্বোচ্চ বাজি ৳${cfg.max_bet}`);

    const roundId = newRoundId("fg2");
    let balance = await debitWalletAtomic(
      admin,
      context.userId,
      stake,
      "fortune-gems-2",
      roundId,
      `Fortune Gems 2${data.extraBet ? " (Extra Bet)" : ""}`,
    );

    const serverSeed = randomSeed();
    const serverSeedHash = await sha256Hex(serverSeed);
    const clientSeed = data.clientSeed || randomSeed(8);
    const nonce = data.nonce ?? 0;

    const result = await fairFortuneGems2Spin(serverSeed, clientSeed, nonce, {
      extraBet: data.extraBet,
      edge: cfg.house_edge,
      winRatePct: cfg.win_rate_pct,
    });

    const scale = Number.isFinite(cfg.payout_multiplier) && cfg.payout_multiplier > 0 ? cfg.payout_multiplier : 1;
    const maxCap = cfg.max_payout_mult > 0 ? cfg.max_payout_mult : data.extraBet ? 15000 : 10000;
    const cappedMult = Math.min(result.totalBaseBetMult * scale, maxCap);
    const wonAmount = Math.round(baseBet * cappedMult * 100) / 100;

    if (wonAmount > 0) {
      const nb = await creditWalletAtomic(
        admin,
        context.userId,
        wonAmount,
        "fortune-gems-2",
        roundId,
        `Fortune Gems 2 win${result.wheelTriggered ? " + Wheel" : ""}`,
      );
      if (nb !== null) balance = nb;
    }

    return {
      result,
      stake,
      wonAmount,
      newBalance: balance,
      serverSeed,
      serverSeedHash,
    };
  });
