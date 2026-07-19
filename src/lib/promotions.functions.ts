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

const promoInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  code: z.string().trim().max(50).optional().nullable(),
  type: z.enum(["deposit_bonus", "free_credit", "cashback"]),
  bonus_pct: z.number().min(0).max(1000).default(0),
  bonus_fixed: z.number().min(0).max(10_000_000).default(0),
  min_deposit: z.number().min(0).max(10_000_000).default(0),
  max_bonus: z.number().min(0).max(10_000_000).default(0),
  wagering_multiplier: z.number().min(0).max(100).default(1),
  max_uses_total: z.number().int().min(1).max(1_000_000).nullable().optional(),
  max_uses_per_user: z.number().int().min(1).max(1000).default(1),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const adminUpsertPromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => promoInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      ...data,
      code: data.code ? data.code.trim().toUpperCase() : null,
      created_by: context.userId,
    };
    const { data: row, error } = await context.supabase
      .from("promotions")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeletePromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("promotions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true as const };
  });

export const claimPromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ code: z.string().trim().min(1).max(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("claim_promo_code", {
      _code: data.code.toUpperCase(),
    });
    if (error) throw new Error(error.message);
    return result?.[0] ?? null;
  });
