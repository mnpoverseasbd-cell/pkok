import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createPhoneAccount = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        phone: z.string().trim().regex(/^01[3-9]\d{8}$/),
        password: z.string().min(6).max(72),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = `${data.phone}@asikgame.app`;

    const { data: existingProfile, error: lookupError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", data.phone)
      .maybeSingle();

    if (lookupError) {
      throw new Error("Account lookup failed");
    }

    if (existingProfile) {
      return { success: false as const, reason: "already_registered" as const };
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
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
        return { success: false as const, reason: "already_registered" as const };
      }
      throw new Error(createError.message);
    }

    if (!created.user) {
      throw new Error("Account creation failed");
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: created.user.id,
        username: data.phone,
        display_name: data.phone,
        email,
        phone: data.phone,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error("Profile setup failed");
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: "user" }, { onConflict: "user_id,role" });

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error("Account role setup failed");
    }

    return { success: true as const, email };
  });