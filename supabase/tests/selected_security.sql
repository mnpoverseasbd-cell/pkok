-- Run this read-only assertion query after applying the selected security migration.
WITH checks(name, passed) AS (
  SELECT 'wallet balance cannot be inserted by users',
    NOT has_column_privilege('authenticated', 'public.profiles', 'wallet_balance', 'INSERT')
  UNION ALL
  SELECT 'wallet balance cannot be updated by users',
    NOT has_column_privilege('authenticated', 'public.profiles', 'wallet_balance', 'UPDATE')
  UNION ALL
  SELECT 'VIP tier cannot be inserted by users',
    NOT has_column_privilege('authenticated', 'public.profiles', 'vip_tier', 'INSERT')
  UNION ALL
  SELECT 'VIP tier cannot be updated by users',
    NOT has_column_privilege('authenticated', 'public.profiles', 'vip_tier', 'UPDATE')
  UNION ALL
  SELECT 'display name remains editable',
    has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE')
  UNION ALL
  SELECT 'transaction approval cannot be supplied by users',
    NOT has_column_privilege('authenticated', 'public.transactions', 'status', 'INSERT')
    AND NOT has_column_privilege('authenticated', 'public.transactions', 'approved_by', 'INSERT')
  UNION ALL
  SELECT 'transactions remain pending payment requests',
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'transactions'
        AND policyname = 'Users can create pending payment requests'
        AND with_check ILIKE '%pending%'
        AND with_check ILIKE '%deposit%'
        AND with_check ILIKE '%withdraw%'
    )
  UNION ALL
  SELECT 'users cannot insert tournament results',
    NOT has_table_privilege('authenticated', 'public.tournament_entries', 'INSERT')
    AND NOT has_column_privilege('authenticated', 'public.tournament_entries', 'total_wager', 'INSERT')
  UNION ALL
  SELECT 'users cannot edit notifications directly',
    NOT has_table_privilege('authenticated', 'public.notifications', 'UPDATE')
  UNION ALL
  SELECT 'role checks do not run as definer',
    NOT (SELECT prosecdef FROM pg_proc WHERE oid = 'public.has_role(uuid, public.app_role)'::regprocedure)
  UNION ALL
  SELECT 'wager leaderboard hides account identities',
    position('public.profiles' in pg_get_functiondef('public.get_wager_leaderboard(text, integer)'::regprocedure)) = 0
    AND position('leaderboard-v1' in pg_get_functiondef('public.get_wager_leaderboard(text, integer)'::regprocedure)) > 0
  UNION ALL
  SELECT 'tournament leaderboard hides account identities',
    position('public.profiles' in pg_get_functiondef('public.get_tournament_leaderboard(uuid, integer)'::regprocedure)) = 0
    AND position('tournament-leaderboard-v1' in pg_get_functiondef('public.get_tournament_leaderboard(uuid, integer)'::regprocedure)) > 0
  UNION ALL
  SELECT 'nightly payouts no longer use the public route',
    EXISTS (
      SELECT 1 FROM cron.job
      WHERE jobid = 1
        AND active
        AND schedule = '0 0 * * *'
        AND position('run_daily_bonuses' in command) > 0
        AND position('run_weekly_bonuses' in command) > 0
        AND position('run_daily_cashback' in command) > 0
        AND position('vip-daily' in command) = 0
    )
)
SELECT 1 / (bool_and(passed)::integer) AS all_selected_database_checks_passed
FROM checks;