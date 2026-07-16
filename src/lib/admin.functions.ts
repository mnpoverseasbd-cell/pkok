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
        initialBalance: z.number().min(0).max(10_000_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = await getAdminClient();
    const email = `${data.phone}@asikgame.app`;

    const { data: existing } = await admin.from("profiles").select("id").eq("phone", data.phone).maybeSingle();
    if (existing) return { success: false as const, reason: "already_registered" as const };

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.phone, display_name: data.phone, phone: data.phone },
    });
    if (error) throw new Error(error.message);
    if (!created.user) throw new Error("Account creation failed");

    await admin.from("profiles").upsert(
      {
        id: created.user.id,
        username: data.phone,
        display_name: data.phone,
        email,
        phone: data.phone,
        wallet_balance: data.initialBalance ?? 0,
      },
      { onConflict: "id" },
    );
    await admin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: "user" }, { onConflict: "user_id,role" });

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
    });
    return { success: true as const, userId: created.user.id };
  });

export const adminAdjustBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        amount: z.number().refine((n) => n !== 0 && Number.isFinite(n), "Amount required"),
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
    const next = current + data.amount;
    if (next < 0) throw new Error("ব্যালেন্স নেগেটিভ হতে পারবে না");

    const { error: uErr } = await admin
      .from("profiles")
      .update({ wallet_balance: next })
      .eq("id", data.userId);
    if (uErr) throw new Error(uErr.message);

    await admin.from("transactions").insert({
      user_id: data.userId,
      type: data.amount > 0 ? "bonus" : "withdraw",
      status: "approved",
      amount: Math.abs(data.amount),
      admin_note: data.note || (data.amount > 0 ? "Admin credit" : "Admin debit"),
      approved_by: context.userId,
      approved_at: new Date().toISOString(),
    });
    await writeAudit(admin, context.userId, "wallet.adjust", "user", data.userId, {
      delta: data.amount,
      balance_after: next,
      note: data.note ?? null,
    });
    return { success: true as const, balance: next };
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
    const admin = await getAdminClient();
    const { error } = await admin.from("feature_flags").delete().eq("flag_key", data.flag_key);
    if (error) throw new Error(error.message);
    await writeAudit(admin, context.userId, "flag.delete", "feature_flag", data.flag_key, {});
    return { success: true as const };
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
