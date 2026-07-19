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

export const listMyNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ limit: z.number().int().min(1).max(100).default(30) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("list_my_notifications", { _limit: data.limit });
    if (error) throw new Error(error.message);
    return { notifications: rows ?? [] };
  });

export const getUnreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_unread_notification_count");
    if (error) throw new Error(error.message);
    return { count: Number(data ?? 0) };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("mark_notification_read", { _id: data.id });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.rpc("mark_all_notifications_read");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      title: z.string().trim().min(1).max(200),
      body: z.string().trim().max(1000).optional().nullable(),
      link: z.string().max(300).optional().nullable(),
      category: z.string().max(50).default("system"),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("notifications")
      .insert({
        user_id: null,
        is_broadcast: true,
        category: data.category,
        title: data.title,
        body: data.body ?? null,
        link: data.link ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { notification: row };
  });

export const adminListNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { notifications: data ?? [] };
  });

export const adminDeleteNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("notifications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
