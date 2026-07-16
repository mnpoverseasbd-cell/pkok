import { createFileRoute } from "@tanstack/react-router";

// Cron endpoint — runs daily bonus + weekly bonus + cashback
export const Route = createFileRoute("/api/public/hooks/vip-daily")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const [daily, weekly, cashback] = await Promise.all([
          supabaseAdmin.rpc("run_daily_bonuses"),
          supabaseAdmin.rpc("run_weekly_bonuses"),
          supabaseAdmin.rpc("run_daily_cashback"),
        ]);

        if (daily.error || weekly.error || cashback.error) {
          return Response.json(
            {
              ok: false,
              daily: daily.error?.message,
              weekly: weekly.error?.message,
              cashback: cashback.error?.message,
            },
            { status: 500 },
          );
        }

        return Response.json({
          ok: true,
          ran_at: new Date().toISOString(),
          daily: daily.data?.[0] ?? null,
          weekly: weekly.data?.[0] ?? null,
          cashback: cashback.data?.[0] ?? null,
        });
      },
    },
  },
});
