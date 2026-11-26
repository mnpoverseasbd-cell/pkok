import { createFileRoute } from "@tanstack/react-router";

function matchesSecret(candidate: string, expected: string): boolean {
  if (candidate.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    mismatch |= candidate.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return mismatch === 0;
}

// Cron endpoint — runs daily bonus + weekly bonus + cashback
export const Route = createFileRoute("/api/public/hooks/vip-daily")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["SERVICE_ROLE_KEY"];
        if (!expected) return Response.json({ ok: false }, { status: 503 });

        const authorization = request.headers.get("authorization") ?? "";
        const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
        const apiKey = request.headers.get("apikey") ?? "";
        if (![bearer, apiKey].some((candidate) => matchesSecret(candidate, expected))) {
          return Response.json({ ok: false }, { status: 401 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const [daily, weekly, cashback] = await Promise.all([
            supabaseAdmin.rpc("run_daily_bonuses"),
            supabaseAdmin.rpc("run_weekly_bonuses"),
            supabaseAdmin.rpc("run_daily_cashback"),
          ]);

          if (daily.error || weekly.error || cashback.error) {
            return Response.json({ ok: false }, { status: 500 });
          }

          return Response.json({
            ok: true,
            ran_at: new Date().toISOString(),
            daily: daily.data?.[0] ?? null,
            weekly: weekly.data?.[0] ?? null,
            cashback: cashback.data?.[0] ?? null,
          });
        } catch {
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
