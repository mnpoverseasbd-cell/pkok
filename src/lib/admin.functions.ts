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

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("নিজেকে ডিলিট করা যাবে না");
    const admin = await getAdminClient();
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
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
    return { success: true as const, balance: next };
  });
