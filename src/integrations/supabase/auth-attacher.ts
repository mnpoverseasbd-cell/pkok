import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    if (typeof window === "undefined") return next();

    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) return next();

    return next({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },
);