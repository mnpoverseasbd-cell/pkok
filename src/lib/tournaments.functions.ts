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

export const listTournaments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tournaments")
      .select("*")
      .order("starts_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { tournaments: data ?? [] };
  });

export const getTournamentLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ tournamentId: z.string().uuid(), limit: z.number().int().min(1).max(200).default(50) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("get_tournament_leaderboard", {
      _tournament_id: data.tournamentId,
      _limit: data.limit,
    });
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const joinTournament = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ tournamentId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("join_tournament", {
      _tournament_id: data.tournamentId,
    });
    if (error) throw new Error(error.message);
    return { entryId: id as string };
  });

export const getMyEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tournament_entries")
      .select("*")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { entries: data ?? [] };
  });

export const getWagerLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ period: z.enum(["daily", "weekly", "monthly"]).default("weekly"), limit: z.number().int().min(1).max(200).default(50) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("get_wager_leaderboard", {
      _period: data.period,
      _limit: data.limit,
    });
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

const tournamentInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  game_id: z.string().max(50).nullable().optional(),
  starts_at: z.string(),
  ends_at: z.string(),
  prize_pool: z.number().min(0).max(1_000_000_000),
  prize_distribution: z.array(z.number().min(0).max(100)).min(1).max(20),
  min_bet: z.number().min(0).max(1_000_000).default(0),
  capacity: z.number().int().min(1).max(1_000_000).nullable().optional(),
  is_active: z.boolean().default(true),
});

export const adminUpsertTournament = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => tournamentInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = { ...data, created_by: context.userId };
    const q = data.id
      ? context.supabase.from("tournaments").update(payload).eq("id", data.id).select().single()
      : context.supabase.from("tournaments").insert(payload).select().single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return { tournament: row };
  });

export const adminDeleteTournament = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tournaments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminFinalizeTournament = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase.rpc("finalize_tournament", {
      _tournament_id: data.id,
    });
    if (error) throw new Error(error.message);
    const r = Array.isArray(rows) ? rows[0] : rows;
    return { paidUsers: Number(r?.paid_users ?? 0), totalPaid: Number(r?.total_paid ?? 0) };
  });
