import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createPhoneAccount = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        phone: z.string().trim().regex(/^01[3-9]\d{8}$/),
        password: z.string().min(6).max(72),
        ref: z.string().trim().min(1).max(64).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"];
    const serviceKey = process.env["SERVICE_ROLE_KEY"];
    if (!url || !serviceKey) {
      throw new Error("Server configuration missing");
    }

    const isNewKey = serviceKey.startsWith("sb_publishable_") || serviceKey.startsWith("sb_secret_");
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (isNewKey && headers.get("Authorization") === `Bearer ${serviceKey}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", serviceKey);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const email = `${data.phone}@asikgame.app`;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        username: data.phone,
        display_name: data.phone,
        phone: data.phone,
      },
    });

    if (createError) {
      const message = createError.message.toLowerCase();
      if (message.includes("already") || message.includes("registered")) {
        return { accepted: true as const };
      }
      throw new Error("Account creation failed");
    }

    if (!created.user) {
      throw new Error("Account creation failed");
    }

    let referredBy: string | null = null;
    if (data.ref) {
      const { data: refProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("referral_code", data.ref)
        .maybeSingle();
      if (refProfile && refProfile.id !== created.user.id) {
        referredBy = refProfile.id;
      }
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: created.user.id,
        username: data.phone,
        display_name: data.phone,
        email,
        phone: data.phone,
        referred_by: referredBy,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw new Error("Profile setup failed");
    }

    const { error: roleError } = await admin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: "user" }, { onConflict: "user_id,role" });

    if (roleError) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw new Error("Account role setup failed");
    }

    return { accepted: true as const };
  });
