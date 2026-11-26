CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user uuid := auth.uid();
BEGIN
  IF requesting_user IS NULL THEN
    RETURN false;
  END IF;

  IF _user_id IS DISTINCT FROM requesting_user
     AND NOT EXISTS (
       SELECT 1
       FROM public.user_roles AS requesting_role
       WHERE requesting_role.user_id = requesting_user
         AND requesting_role.role = 'admin'::public.app_role
     ) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles AS requested_role
    WHERE requested_role.user_id = _user_id
      AND requested_role.role = _role
  );
END;
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE INSERT, UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE INSERT (id, username, display_name, avatar_url, phone, email, referral_code, wallet_balance, vip_tier, created_at, updated_at, referred_by, last_daily_bonus_at, last_weekly_bonus_at, last_cashback_at)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (id, username, display_name, avatar_url, phone, email, referral_code, wallet_balance, vip_tier, created_at, updated_at, referred_by, last_daily_bonus_at, last_weekly_bonus_at, last_cashback_at)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT INSERT (id, username, display_name, avatar_url, phone, email, referral_code)
  ON TABLE public.profiles TO authenticated;
GRANT UPDATE (username, display_name, avatar_url, phone, email)
  ON TABLE public.profiles TO authenticated;

REVOKE INSERT ON TABLE public.transactions FROM PUBLIC, anon, authenticated;
REVOKE INSERT (id, user_id, type, status, amount, payment_method_id, sender_account, receiver_account, txn_reference, user_note, admin_note, approved_by, approved_at, created_at, updated_at, round_id, game_id)
  ON TABLE public.transactions FROM PUBLIC, anon, authenticated;
GRANT INSERT (user_id, type, amount, payment_method_id, sender_account, receiver_account, txn_reference, user_note)
  ON TABLE public.transactions TO authenticated;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users create own requests" ON public.transactions;
DROP POLICY IF EXISTS "Users can create pending payment requests" ON public.transactions;
CREATE POLICY "Users can create pending payment requests"
  ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'::public.txn_status
    AND type IN ('deposit'::public.txn_type, 'withdraw'::public.txn_type)
    AND approved_by IS NULL
    AND approved_at IS NULL
  );

REVOKE INSERT ON TABLE public.tournament_entries FROM PUBLIC, anon, authenticated;
REVOKE INSERT (id, tournament_id, user_id, total_wager, total_bets, prize_awarded, final_rank, joined_at, updated_at)
  ON TABLE public.tournament_entries FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "user joins self" ON public.tournament_entries;
DROP POLICY IF EXISTS "Users and admins can insert tournament entries" ON public.tournament_entries;
DROP POLICY IF EXISTS "Users can insert tournament entries" ON public.tournament_entries;

REVOKE UPDATE ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "update own personal" ON public.notifications;

DROP FUNCTION IF EXISTS public.get_wager_leaderboard(text, integer);
CREATE FUNCTION public.get_wager_leaderboard(_period text, _limit integer DEFAULT 50)
RETURNS TABLE(rank integer, user_id uuid, display_name text, username text, vip_tier text, total_wager numeric, total_bets integer, is_current_user boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH period_context AS (
    SELECT
      CASE
        WHEN _period = 'monthly' THEN 'monthly'
        WHEN _period = 'daily' THEN 'daily'
        ELSE 'weekly'
      END AS period_key,
      CASE
        WHEN _period = 'monthly' THEN now() - interval '30 days'
        WHEN _period = 'daily' THEN now() - interval '1 day'
        ELSE now() - interval '7 days'
      END AS starts_at
  ),
  aggregates AS (
    SELECT transactions.user_id, SUM(transactions.amount) AS total_wager, COUNT(*)::integer AS total_bets
    FROM public.transactions AS transactions
    CROSS JOIN period_context
    WHERE transactions.type = 'bet'::public.txn_type
      AND transactions.status = 'approved'::public.txn_status
      AND transactions.created_at >= period_context.starts_at
      AND auth.uid() IS NOT NULL
    GROUP BY transactions.user_id
  ),
  ranked AS (
    SELECT
      aggregates.user_id,
      aggregates.total_wager,
      aggregates.total_bets,
      ROW_NUMBER() OVER (ORDER BY aggregates.total_wager DESC)::integer AS rank_no
    FROM aggregates
  )
  SELECT
    ranked.rank_no,
    md5(ranked.user_id::text || '|' || period_context.period_key || '|leaderboard-v1')::uuid,
    'Player ' || ranked.rank_no::text,
    NULL::text,
    NULL::text,
    ranked.total_wager,
    ranked.total_bets,
    auth.uid() = ranked.user_id
  FROM ranked
  CROSS JOIN period_context
  ORDER BY ranked.rank_no
  LIMIT LEAST(GREATEST(COALESCE(_limit, 50), 1), 200);
$$;
REVOKE ALL ON FUNCTION public.get_wager_leaderboard(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_wager_leaderboard(text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_tournament_leaderboard(_tournament_id uuid, _limit integer DEFAULT 100)
RETURNS TABLE(rank integer, user_id uuid, display_name text, username text, total_wager numeric, total_bets integer, prize numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  tournament public.tournaments%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO tournament
  FROM public.tournaments AS t
  WHERE t.id = _tournament_id;

  IF tournament.id IS NULL THEN
    RETURN;
  END IF;

  IF NOT tournament.is_active
     AND tournament.ends_at > now()
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH ranked AS (
    SELECT
      entries.user_id,
      entries.total_wager,
      entries.total_bets,
      ROW_NUMBER() OVER (ORDER BY entries.total_wager DESC)::integer AS rank_no
    FROM public.tournament_entries AS entries
    WHERE entries.tournament_id = tournament.id
  )
  SELECT
    ranked.rank_no,
    md5(ranked.user_id::text || '|' || tournament.id::text || '|tournament-leaderboard-v1')::uuid,
    'Player ' || ranked.rank_no::text,
    NULL::text,
    ranked.total_wager,
    ranked.total_bets,
    CASE
      WHEN ranked.rank_no <= jsonb_array_length(tournament.prize_distribution)
           AND ranked.total_wager > 0
      THEN ROUND(
        tournament.prize_pool *
        COALESCE((tournament.prize_distribution ->> (ranked.rank_no - 1))::numeric, 0) / 100.0,
        2
      )
      ELSE 0
    END
  FROM ranked
  ORDER BY ranked.rank_no
  LIMIT LEAST(GREATEST(COALESCE(_limit, 100), 1), 200);
END;
$$;
REVOKE ALL ON FUNCTION public.get_tournament_leaderboard(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(uuid, integer) TO authenticated;