import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server configuration missing");
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

async function writeAudit(
  admin: any,
  actorId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  details: Record<string, unknown> = {},
) {
  try {
    const { data: prof } = await admin
      .from("profiles")
      .select("display_name, username, phone, email")
      .eq("id", actorId)
      .maybeSingle();
    const label =
      prof?.display_name || prof?.username || prof?.phone || prof?.email || actorId.slice(0, 8);
    await admin.rpc("record_audit", {
      _actor_id: actorId,
      _actor_label: label,
      _action: action,
      _target_type: targetType,
      _target_id: targetId,
      _details: details,
    });
  } catch (e) {
    console.error("[audit] failed", action, e);
  }
}

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("নিজেকে ডিলিট করা যাবে না");
    const admin = await getAdminClient();
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await writeAudit(admin, context.userId, "user.delete", "user", data.userId, {});
    return { success: true as const };
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        phone: z.string().trim().regex(/^01[3-9]\d{8}$/),
        password: z.string().min(6).max(72),
        displayName: z.string().trim().max(80).optional(),
        initialBalance: z.number().min(0).max(10_000_000).optional(),
        makeAdmin: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const email = `${data.phone}@asikgame.app`;
    const display = data.displayName?.trim() || data.phone;

    const { data: existing } = await admin.from("profiles").select("id").eq("phone", data.phone).maybeSingle();
    if (existing) return { success: false as const, reason: "already_registered" as const };

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.phone, display_name: display, phone: data.phone },
    });
    if (error) throw new Error(error.message);
    if (!created.user) throw new Error("Account creation failed");

    await admin.from("profiles").upsert(
      {
        id: created.user.id,
        username: data.phone,
        display_name: display,
        email,
        phone: data.phone,
        wallet_balance: data.initialBalance ?? 0,
      },
      { onConflict: "id" },
    );
    await admin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: "user" }, { onConflict: "user_id,role" });
    if (data.makeAdmin) {
      await admin
        .from("user_roles")
        .upsert({ user_id: created.user.id, role: "admin" }, { onConflict: "user_id,role" });
    }

    if (data.initialBalance && data.initialBalance > 0) {
      await admin.from("transactions").insert({
        user_id: created.user.id,
        type: "bonus",
        status: "approved",
        amount: data.initialBalance,
        admin_note: "Admin created account with initial balance",
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
      });
    }
    await writeAudit(admin, context.userId, "user.create", "user", created.user.id, {
      phone: data.phone,
      initialBalance: data.initialBalance ?? 0,
      makeAdmin: !!data.makeAdmin,
    });
    return { success: true as const, userId: created.user.id };
  });

export const adminAdjustBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        amount: z.number().refine((n) => Number.isFinite(n), "Amount required"),
        mode: z.enum(["delta", "set"]).optional(),
        note: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const { data: prof, error: pErr } = await admin
      .from("profiles")
      .select("wallet_balance")
      .eq("id", data.userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!prof) throw new Error("User not found");
    const current = Number(prof.wallet_balance ?? 0);
    const mode = data.mode ?? "delta";
    const next = mode === "set" ? data.amount : current + data.amount;
    const delta = next - current;
    if (delta === 0) return { success: true as const, balance: current };
    if (next < 0) throw new Error("ব্যালেন্স নেগেটিভ হতে পারবে না");

    const { error: uErr } = await admin
      .from("profiles")
      .update({ wallet_balance: next })
      .eq("id", data.userId);
    if (uErr) throw new Error(uErr.message);

    await admin.from("transactions").insert({
      user_id: data.userId,
      type: delta > 0 ? "bonus" : "withdraw",
      status: "approved",
      amount: Math.abs(delta),
      admin_note: data.note || (mode === "set" ? `Admin set balance to ৳${next}` : delta > 0 ? "Admin credit" : "Admin debit"),
      approved_by: context.userId,
      approved_at: new Date().toISOString(),
    });
    await writeAudit(admin, context.userId, "wallet.adjust", "user", data.userId, {
      mode,
      delta,
      balance_after: next,
      note: data.note ?? null,
    });
    return { success: true as const, balance: next };
  });

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const [{ data: profs, error: pErr }, { data: roles }, authRes] = await Promise.all([
      admin
        .from("profiles")
        .select("id, display_name, username, email, phone, wallet_balance, vip_tier, referral_code, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      admin.from("user_roles").select("user_id, role"),
      admin.auth.admin.listUsers({ page: 1, perPage: 500 }),
    ]);
    if (pErr) throw new Error(pErr.message);
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });
    const authMap = new Map<string, { banned_until?: string | null; last_sign_in_at?: string | null }>();
    ((authRes.data?.users ?? []) as any[]).forEach((u) => {
      authMap.set(u.id, { banned_until: u.banned_until ?? null, last_sign_in_at: u.last_sign_in_at ?? null });
    });
    const rows = (profs ?? []).map((p: any) => {
      const au = authMap.get(p.id);
      const isBanned = !!au?.banned_until && new Date(au.banned_until).getTime() > Date.now();
      return {
        ...p,
        user_roles: (roleMap.get(p.id) ?? []).map((role) => ({ role })),
        is_banned: isBanned,
        last_sign_in_at: au?.last_sign_in_at ?? null,
      };
    });
    return { rows };
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        display_name: z.string().trim().max(80).nullable().optional(),
        username: z.string().trim().max(80).nullable().optional(),
        phone: z.string().trim().max(30).nullable().optional(),
        vip_tier: z.enum(["bronze", "silver", "gold", "platinum", "diamond"]).optional(),
        banned: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.banned && data.userId === context.userId) {
      throw new Error("নিজেকে ব্যান করা যাবে না");
    }
    const admin = await getAdminClient();
    const patch: Record<string, unknown> = {};
    if (data.display_name !== undefined) patch.display_name = data.display_name;
    if (data.username !== undefined) patch.username = data.username;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.vip_tier !== undefined) patch.vip_tier = data.vip_tier;
    if (Object.keys(patch).length > 0) {
      const { error } = await admin.from("profiles").update(patch).eq("id", data.userId);
      if (error) throw new Error(error.message);
    }
    if (data.banned !== undefined) {
      const { error } = await admin.auth.admin.updateUserById(data.userId, {
        ban_duration: data.banned ? "876000h" : "none",
      });
      if (error) throw new Error(error.message);
    }
    await writeAudit(admin, context.userId, "user.update", "user", data.userId, {
      ...patch,
      banned: data.banned,
    });
    return { success: true as const };
  });

export const adminResetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(6).max(72) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const { error } = await admin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
    await writeAudit(admin, context.userId, "user.password_reset", "user", data.userId, {});
    return { success: true as const };
  });

export const adminGetUserDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const [profRes, txnsRes, allTxnsRes] = await Promise.all([
      admin.from("profiles").select("*").eq("id", data.userId).maybeSingle(),
      admin
        .from("transactions")
        .select("id, type, status, amount, game_id, txn_reference, sender_account, receiver_account, admin_note, created_at")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: false })
        .limit(40),
      admin
        .from("transactions")
        .select("type, status, amount")
        .eq("user_id", data.userId)
        .eq("status", "approved")
        .limit(2000),
    ]);
    if (profRes.error) throw new Error(profRes.error.message);
    const summary = { deposits: 0, withdraws: 0, bets: 0, wins: 0, bonuses: 0 };
    (allTxnsRes.data ?? []).forEach((t: any) => {
      const a = Number(t.amount ?? 0);
      if (t.type === "deposit") summary.deposits += a;
      else if (t.type === "withdraw") summary.withdraws += a;
      else if (t.type === "bet") summary.bets += a;
      else if (t.type === "win") summary.wins += a;
      else if (t.type === "bonus") summary.bonuses += a;
    });
    return {
      profile: profRes.data,
      transactions: txnsRes.data ?? [],
      summary,
    };
  });

export const adminProcessTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        note: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const { data: existing, error: fetchErr } = await admin
      .from("transactions")
      .select("id, user_id, type, status, amount")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!existing) throw new Error("Transaction not found");
    if (existing.status !== "pending") throw new Error("Only pending transactions can be processed");

    const { error } = await admin
      .from("transactions")
      .update({
        status: data.status,
        admin_note: data.note?.trim() || null,
        approved_by: context.userId,
        approved_at: data.status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await writeAudit(admin, context.userId, `txn.${data.status}`, "transaction", data.id, {
      user_id: existing.user_id,
      type: existing.type,
      amount: existing.amount,
      note: data.note ?? null,
    });
    return { success: true as const };
  });

const ALL_GAMES_CATALOG: { game_key: string; name: string }[] = [
  { game_key: "dice", name: "Lucky Dice" },
  { game_key: "crash", name: "Crash" },
  { game_key: "mines", name: "Mines" },
  { game_key: "plinko", name: "Plinko" },
  { game_key: "wheel", name: "Wheel of Fortune" },
  { game_key: "limbo", name: "Limbo" },
  { game_key: "coinflip", name: "Coin Flip" },
  { game_key: "chicken-road", name: "Chicken Road" },
  { game_key: "tower", name: "Tower — Royal Step" },
  { game_key: "lucky-card", name: "Lucky Card" },
  { game_key: "shell-game", name: "Shell Game" },
  { game_key: "scratch-card", name: "Scratch Card" },
  { game_key: "keno", name: "Keno" },
  { game_key: "hi-lo", name: "Hi-Lo" },
  { game_key: "color-prediction", name: "Color Prediction" },
  { game_key: "andar-bahar", name: "Andar Bahar" },
  { game_key: "dragon-tiger", name: "Dragon Tiger" },
  { game_key: "teen-patti", name: "Teen Patti" },
  { game_key: "seven-up-down", name: "7 Up 7 Down" },
  { game_key: "baccarat", name: "Baccarat" },
  { game_key: "sic-bo", name: "Sic Bo" },
  { game_key: "roulette", name: "Roulette" },
  { game_key: "blackjack", name: "Blackjack" },
  { game_key: "32-cards", name: "32 Cards" },
  { game_key: "video-poker", name: "Video Poker · Jacks or Better" },
  { game_key: "slots", name: "Cosmic Fortune Slots" },
  { game_key: "bingo", name: "Bingo 75" },
  { game_key: "matka", name: "Matka King" },
  { game_key: "fish-shooter", name: "Fish Shooter · Cast Net" },
  { game_key: "megaways", name: "Fruit Slots · Megaways" },
  { game_key: "aviatrix", name: "Aviatrix · Multi-Race" },
  { game_key: "dragon-fishing", name: "Dragon Fortune Fishing" },
  { game_key: "penalty", name: "Penalty Shootout · Golden Boot" },
  { game_key: "cricket", name: "Cricket Star · Six-Over Chase" },
  { game_key: "ludo", name: "Ludo Dash · Race to 57" },
  { game_key: "carrom", name: "Carrom Strike · Pocket King" },
  { game_key: "fan-tan", name: "Fan-Tan · Bead Count" },
  { game_key: "balloon", name: "Balloon · Cash or Crash" },
  { game_key: "dragon-phoenix", name: "Dragon vs Phoenix · Battle Wheel" },
  { game_key: "wingo", name: "Wingo · 3-Minute Lottery" },
  { game_key: "aviator-x2", name: "Aviator X2 · Duo-Plane" },
  { game_key: "jhandi-munda", name: "Jhandi Munda · Crown & Anchor" },
];

export const adminSyncAllGames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const { data: existing, error: eErr } = await admin.from("game_configs").select("game_key");
    if (eErr) throw new Error(eErr.message);
    const existingSet = new Set((existing ?? []).map((r: any) => r.game_key));
    const missing = ALL_GAMES_CATALOG.filter((g) => !existingSet.has(g.game_key)).map((g) => ({
      game_key: g.game_key,
      name: g.name,
      is_enabled: true,
      min_bet: 10,
      max_bet: 10000,
      house_edge: 0.04,
      config: { win_rate_pct: 50, payout_multiplier: 1, max_payout_mult: 0 },
    }));
    if (missing.length > 0) {
      const { error } = await admin.from("game_configs").insert(missing);
      if (error) throw new Error(error.message);
      await writeAudit(admin, context.userId, "games.sync", "game_config", null, {
        inserted: missing.length,
      });
    }
    return { inserted: missing.length, total: ALL_GAMES_CATALOG.length };
  });

export const adminUpsertGameConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        game_key: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
        name: z.string().trim().min(1).max(120),
        is_enabled: z.boolean(),
        min_bet: z.number().min(0),
        max_bet: z.number().positive(),
        house_edge: z.number().min(0).max(0.95),
        win_rate_pct: z.number().min(1).max(99).default(50),
        payout_multiplier: z.number().min(0.1).max(10).default(1),
        max_payout_mult: z.number().min(0).max(100000).default(0),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.min_bet > data.max_bet) throw new Error("Min Bet cannot exceed Max Bet");
    const admin = await getAdminClient();
    const existingCfg = data.id
      ? ((await admin.from("game_configs").select("config").eq("id", data.id).maybeSingle()).data?.config as Record<string, unknown>) ?? {}
      : {};
    const mergedConfig = {
      ...existingCfg,
      win_rate_pct: data.win_rate_pct,
      payout_multiplier: data.payout_multiplier,
      max_payout_mult: data.max_payout_mult,
    };
    const payload = {
      game_key: data.game_key,
      name: data.name,
      is_enabled: data.is_enabled,
      min_bet: data.min_bet,
      max_bet: data.max_bet,
      house_edge: data.house_edge,
      config: mergedConfig,
    };
    const { data: row, error } = data.id
      ? await admin.from("game_configs").update(payload).eq("id", data.id).select().maybeSingle()
      : await admin.from("game_configs").upsert(payload, { onConflict: "game_key" }).select().maybeSingle();
    if (error) throw new Error(error.message);
    await writeAudit(admin, context.userId, "game.config.update", "game_config", data.game_key, payload);
    return { row };
  });

export const adminBulkUpdateGames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        gameKeys: z.array(z.string()).min(1),
        win_rate_pct: z.number().min(1).max(99).optional(),
        house_edge: z.number().min(0).max(0.95).optional(),
        is_enabled: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const { data: rows, error } = await admin
      .from("game_configs")
      .select("id, game_key, config, house_edge, is_enabled")
      .in("game_key", data.gameKeys);
    if (error) throw new Error(error.message);

    for (const r of rows ?? []) {
      const nextCfg = {
        ...((r.config as Record<string, unknown>) ?? {}),
        ...(data.win_rate_pct !== undefined ? { win_rate_pct: data.win_rate_pct } : {}),
      };
      const patch: Record<string, unknown> = { config: nextCfg };
      if (data.house_edge !== undefined) patch.house_edge = data.house_edge;
      if (data.is_enabled !== undefined) patch.is_enabled = data.is_enabled;
      const { error: uErr } = await admin.from("game_configs").update(patch).eq("id", r.id);
      if (uErr) throw new Error(uErr.message);
    }
    await writeAudit(admin, context.userId, "games.bulk_update", "game_config", null, {
      count: (rows ?? []).length,
      win_rate_pct: data.win_rate_pct,
      house_edge: data.house_edge,
      is_enabled: data.is_enabled,
    });
    return { updated: (rows ?? []).length };
  });

export const adminDeleteGameConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const { error } = await admin.from("game_configs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(admin, context.userId, "game.config.delete", "game_config", data.id, {});
    return { success: true as const };
  });

export const adminRunVipPayouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const [daily, weekly, cashback] = await Promise.all([
      admin.rpc("run_daily_bonuses"),
      admin.rpc("run_weekly_bonuses"),
      admin.rpc("run_daily_cashback"),
    ]);
    if (daily.error) throw new Error(`daily: ${daily.error.message}`);
    if (weekly.error) throw new Error(`weekly: ${weekly.error.message}`);
    if (cashback.error) throw new Error(`cashback: ${cashback.error.message}`);
    const result = {
      ran_at: new Date().toISOString(),
      daily: (daily.data as any)?.[0] ?? { credited_users: 0, total_amount: 0 },
      weekly: (weekly.data as any)?.[0] ?? { credited_users: 0, total_amount: 0 },
      cashback: (cashback.data as any)?.[0] ?? { credited_users: 0, total_amount: 0 },
    };
    await writeAudit(admin, context.userId, "vip.payout.run", "cron", null, result);
    return result;
  });

export const adminPreviewVipPayouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const [daily, weekly, cashback] = await Promise.all([
      admin.rpc("preview_daily_bonuses"),
      admin.rpc("preview_weekly_bonuses"),
      admin.rpc("preview_daily_cashback"),
    ]);
    if (daily.error) throw new Error(`daily: ${daily.error.message}`);
    if (weekly.error) throw new Error(`weekly: ${weekly.error.message}`);
    if (cashback.error) throw new Error(`cashback: ${cashback.error.message}`);

    const dailyRows = (daily.data as any[]) ?? [];
    const weeklyRows = (weekly.data as any[]) ?? [];
    const cashbackRows = ((cashback.data as any[]) ?? []).filter((r) => Number(r.amount) > 0);

    const allIds = Array.from(
      new Set([...dailyRows, ...weeklyRows, ...cashbackRows].map((r) => r.user_id)),
    );
    let nameMap: Record<string, string> = {};
    if (allIds.length) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, display_name, username, phone")
        .in("id", allIds);
      (profs ?? []).forEach((p: any) => {
        nameMap[p.id] = p.display_name || p.username || p.phone || p.id.slice(0, 8);
      });
    }

    const sum = (rows: any[]) => rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const decorate = (rows: any[]) =>
      rows.map((r) => ({ ...r, display: nameMap[r.user_id] || r.user_id.slice(0, 8) }));

    return {
      previewed_at: new Date().toISOString(),
      daily: { users: dailyRows.length, total: sum(dailyRows), entries: decorate(dailyRows) },
      weekly: { users: weeklyRows.length, total: sum(weeklyRows), entries: decorate(weeklyRows) },
      cashback: {
        users: cashbackRows.length,
        total: sum(cashbackRows),
        entries: decorate(cashbackRows),
      },
    };
  });

export const adminListAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        limit: z.number().int().min(1).max(500).default(100),
        action: z.string().optional(),
        actorId: z.string().uuid().optional(),
        since: z.string().datetime().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    let q = admin
      .from("audit_logs")
      .select("id, actor_id, actor_label, action, target_type, target_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.action) q = q.eq("action", data.action);
    if (data.actorId) q = q.eq("actor_id", data.actorId);
    if (data.since) q = q.gte("created_at", data.since);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const adminLogAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        action: z.string().min(1).max(100),
        targetType: z.string().max(50).optional(),
        targetId: z.string().max(100).optional(),
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    await writeAudit(
      admin,
      context.userId,
      data.action,
      data.targetType ?? null,
      data.targetId ?? null,
      data.details ?? {},
    );
    return { success: true as const };
  });

export const adminListFeatureFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const { data, error } = await admin
      .from("feature_flags")
      .select("*")
      .not("flag_key", "like", "game.disabled.%")
      .order("flag_key", { ascending: true });
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const adminUpsertFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        flag_key: z
          .string()
          .trim()
          .min(2)
          .max(80)
          .regex(/^[a-z0-9_.-]+$/, "lowercase, digits, . _ - only"),
        enabled: z.boolean(),
        description: z.string().max(500).nullable().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.flag_key.startsWith("game.disabled.")) {
      throw new Error("This feature flag is system-managed");
    }
    const admin = await getAdminClient();
    const { data: row, error } = await admin
      .from("feature_flags")
      .upsert(
        {
          flag_key: data.flag_key,
          enabled: data.enabled,
          description: data.description ?? null,
          metadata: data.metadata ?? {},
        },
        { onConflict: "flag_key" },
      )
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    await writeAudit(admin, context.userId, "flag.upsert", "feature_flag", data.flag_key, {
      enabled: data.enabled,
    });
    return { row };
  });

export const adminDeleteFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ flag_key: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.flag_key.startsWith("game.disabled.")) {
      throw new Error("This feature flag is system-managed");
    }
    const admin = await getAdminClient();
    const { error } = await admin.from("feature_flags").delete().eq("flag_key", data.flag_key);
    if (error) throw new Error(error.message);
    await writeAudit(admin, context.userId, "flag.delete", "feature_flag", data.flag_key, {});
    return { success: true as const };
  });

export const adminListVipTierConfigs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const { data, error } = await admin
      .from("vip_tier_configs")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const adminUpdateVipTierConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        patch: z
          .object({
            min_deposit_total: z.number().finite().optional(),
            cashback_pct: z.number().finite().optional(),
            daily_bonus: z.number().finite().optional(),
            weekly_bonus: z.number().finite().optional(),
            min_deposit_amount: z.number().finite().optional(),
            max_deposit_amount: z.number().finite().optional(),
            min_withdraw_amount: z.number().finite().optional(),
            max_withdraw_amount: z.number().finite().optional(),
          })
          .strict(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (Object.keys(data.patch).length === 0) throw new Error("No tier changes provided");

    const admin = await getAdminClient();
    const { data: row, error } = await admin
      .from("vip_tier_configs")
      .update(data.patch)
      .eq("id", data.id)
      .select("id, tier")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("VIP tier not found");

    await writeAudit(admin, context.userId, "vip.tier.update", "vip_tier_config", data.id, data.patch);
    return { tier: row.tier };
  });

export const adminReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ days: z.number().int().min(1).max(90).default(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();

    const [txnsRes, usersRes, wagerRes] = await Promise.all([
      admin
        .from("transactions")
        .select("type, status, amount, approved_at, created_at, user_id")
        .gte("created_at", since)
        .limit(10000),
      admin.from("profiles").select("id, created_at").gte("created_at", since).limit(10000),
      admin
        .from("transactions")
        .select("user_id, type, amount")
        .in("type", ["deposit", "bet", "win"])
        .eq("status", "approved")
        .gte("approved_at", since)
        .limit(10000),
    ]);
    if (txnsRes.error) throw new Error(txnsRes.error.message);
    if (usersRes.error) throw new Error(usersRes.error.message);
    if (wagerRes.error) throw new Error(wagerRes.error.message);

    const txns = txnsRes.data ?? [];
    const newUsers = usersRes.data ?? [];
    const wager = wagerRes.data ?? [];

    // Daily buckets
    const dayKey = (iso: string) => iso.slice(0, 10);
    const days: Record<
      string,
      { day: string; deposits: number; withdrawals: number; bets: number; wins: number; new_users: number; ggr: number }
    > = {};
    for (let i = 0; i < data.days; i++) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      days[d] = { day: d, deposits: 0, withdrawals: 0, bets: 0, wins: 0, new_users: 0, ggr: 0 };
    }
    for (const t of txns) {
      if (t.status !== "approved") continue;
      const k = dayKey(t.approved_at || t.created_at);
      const row = days[k];
      if (!row) continue;
      const amt = Number(t.amount || 0);
      if (t.type === "deposit") row.deposits += amt;
      else if (t.type === "withdraw") row.withdrawals += amt;
      else if (t.type === "bet") row.bets += amt;
      else if (t.type === "win") row.wins += amt;
    }
    for (const u of newUsers) {
      const k = dayKey(u.created_at);
      if (days[k]) days[k].new_users += 1;
    }
    Object.values(days).forEach((d) => (d.ggr = d.bets - d.wins));
    const series = Object.values(days).sort((a, b) => (a.day < b.day ? -1 : 1));

    // Totals
    const totals = series.reduce(
      (acc, d) => ({
        deposits: acc.deposits + d.deposits,
        withdrawals: acc.withdrawals + d.withdrawals,
        bets: acc.bets + d.bets,
        wins: acc.wins + d.wins,
        new_users: acc.new_users + d.new_users,
        ggr: acc.ggr + d.ggr,
      }),
      { deposits: 0, withdrawals: 0, bets: 0, wins: 0, new_users: 0, ggr: 0 },
    );

    // Top depositors
    const depByUser = new Map<string, number>();
    for (const t of txns) {
      if (t.type === "deposit" && t.status === "approved") {
        depByUser.set(t.user_id, (depByUser.get(t.user_id) ?? 0) + Number(t.amount || 0));
      }
    }
    const topIds = [...depByUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const wagerByUser = new Map<string, number>();
    for (const w of wager) {
      if (w.type === "bet") wagerByUser.set(w.user_id, (wagerByUser.get(w.user_id) ?? 0) + Number(w.amount || 0));
    }
    const topWagerIds = [...wagerByUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    const allIds = Array.from(new Set([...topIds.map(([id]) => id), ...topWagerIds.map(([id]) => id)]));
    let nameMap: Record<string, string> = {};
    if (allIds.length) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, display_name, username, phone")
        .in("id", allIds);
      (profs ?? []).forEach((p: any) => {
        nameMap[p.id] = p.display_name || p.username || p.phone || p.id.slice(0, 8);
      });
    }

    return {
      generated_at: new Date().toISOString(),
      window_days: data.days,
      totals,
      series,
      top_depositors: topIds.map(([id, amt]) => ({ user_id: id, display: nameMap[id] || id.slice(0, 8), amount: amt })),
      top_wagerers: topWagerIds.map(([id, amt]) => ({ user_id: id, display: nameMap[id] || id.slice(0, 8), amount: amt })),
    };
  });
