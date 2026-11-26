import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminSupabase } from "@/lib/admin-supabase";

/**
 * Client-side function middleware that selects the appropriate Supabase session
 * (the isolated Admin Portal session on `/admin*`, or the customer session elsewhere)
 * and automatically refreshes expired/near-expiry JWTs before calling server functions.
 */
export const attachSmartSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    if (typeof window === "undefined") {
      return next();
    }

    const isAdminRoute = window.location.pathname.startsWith("/admin");
    const client = isAdminRoute ? adminSupabase : supabase;

    let {
      data: { session },
    } = await client.auth.getSession();

    // Refresh proactively if expired or expiring within 60 seconds
    if (session?.expires_at && session.expires_at * 1000 < Date.now() + 60_000) {
      const { data: refreshed } = await client.auth.refreshSession();
      if (refreshed.session) {
        session = refreshed.session;
      }
    }

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    return next({ headers });
  },
);
