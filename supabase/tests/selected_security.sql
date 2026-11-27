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
  UNION ALL
  SELECT 'browser sessions cannot mutate game wallets',
    NOT has_function_privilege(
      'authenticated',
      'public.wallet_mutate(public.txn_type,numeric,text,text,text)',
      'EXECUTE'
    )
  UNION ALL
  SELECT 'game odds are protected by a database trigger',
    EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid = 'public.game_configs'::regclass
        AND tgname = 'trg_prevent_game_odds_changes'
        AND NOT tgisinternal
    )
  UNION ALL
  SELECT 'VIP reward ceilings are enforced',
    EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.vip_tier_configs'::regclass
        AND conname = 'vip_tier_reward_caps'
    )
  UNION ALL
  SELECT 'existing VIP rewards stay within their current levels',
    NOT EXISTS (
      SELECT 1
      FROM (VALUES
        ('bronze'::text, 10::numeric, 50::numeric, 1::numeric),
        ('silver'::text, 25::numeric, 150::numeric, 2::numeric),
        ('gold'::text, 60::numeric, 400::numeric, 4::numeric),
        ('platinum'::text, 150::numeric, 1000::numeric, 6::numeric),
        ('diamond'::text, 400::numeric, 3000::numeric, 10::numeric)
      ) AS expected(tier, daily_bonus, weekly_bonus, cashback_pct)
      LEFT JOIN public.vip_tier_configs AS actual USING (tier)
      WHERE actual.tier IS NULL
        OR actual.daily_bonus IS DISTINCT FROM expected.daily_bonus
        OR actual.weekly_bonus IS DISTINCT FROM expected.weekly_bonus
        OR actual.cashback_pct IS DISTINCT FROM expected.cashback_pct
    )
  UNION ALL
  SELECT 'deposit approval checks self-created accounts',
    EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid = 'public.transactions'::regclass
        AND tgname = 'trg_prevent_admin_self_deposit_approval'
        AND NOT tgisinternal
    )
  UNION ALL
  SELECT 'promotions block creator self-claims',
    position('created_by_admin' in pg_get_functiondef('public.claim_promo_code(text)'::regprocedure)) > 0
  UNION ALL
  SELECT 'admin-created accounts are marked',
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'created_by_admin'
    )
)
SELECT 1 / (bool_and(passed)::integer) AS all_selected_database_checks_passed
FROM checks;