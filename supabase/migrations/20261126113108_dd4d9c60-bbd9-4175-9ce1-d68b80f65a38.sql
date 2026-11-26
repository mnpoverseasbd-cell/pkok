REVOKE SELECT ON TABLE public.feature_flags, public.game_configs, public.vip_tier_configs, public.tournaments, public.tournament_entries FROM anon;

DROP POLICY IF EXISTS "Authenticated can read feature flags" ON public.feature_flags;
CREATE POLICY "Authenticated can read enabled feature flags"
  ON public.feature_flags
  FOR SELECT TO authenticated
  USING (enabled OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can view game configs" ON public.game_configs;
CREATE POLICY "Admins can read all game configs"
  ON public.game_configs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can view tier configs" ON public.vip_tier_configs;

DROP POLICY IF EXISTS "authenticated read tournaments" ON public.tournaments;
CREATE POLICY "Authenticated can read public tournaments"
  ON public.tournaments
  FOR SELECT TO authenticated
  USING (
    is_active
    OR ends_at <= now()
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "authenticated read entries" ON public.tournament_entries;
CREATE POLICY "Users can read own tournament entries"
  ON public.tournament_entries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_public_vip_tier_benefits()
RETURNS TABLE (
  tier text,
  min_deposit_total numeric,
  cashback_pct numeric,
  daily_bonus numeric,
  weekly_bonus numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    configs.tier,
    configs.min_deposit_total,
    configs.cashback_pct,
    configs.daily_bonus,
    configs.weekly_bonus
  FROM public.vip_tier_configs AS configs
  WHERE auth.uid() IS NOT NULL
  ORDER BY configs.sort_order;
$$;

REVOKE ALL ON FUNCTION public.get_public_vip_tier_benefits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_vip_tier_benefits() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_game_config(_game_key text)
RETURNS TABLE (
  id uuid,
  game_key text,
  name text,
  is_enabled boolean,
  min_bet numeric,
  max_bet numeric,
  house_edge numeric,
  config jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    configs.id,
    configs.game_key,
    configs.name,
    configs.is_enabled,
    CASE WHEN configs.is_enabled THEN configs.min_bet ELSE 0 END,
    CASE WHEN configs.is_enabled THEN configs.max_bet ELSE 0 END,
    CASE WHEN configs.is_enabled THEN configs.house_edge ELSE 0 END,
    CASE WHEN configs.is_enabled THEN configs.config ELSE '{}'::jsonb END
  FROM public.game_configs AS configs
  WHERE configs.game_key = _game_key
    AND (auth.uid() IS NOT NULL OR configs.is_enabled);
$$;

REVOKE ALL ON FUNCTION public.get_public_game_config(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_game_config(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_tournament_leaderboard(
  _tournament_id uuid,
  _limit integer DEFAULT 100
)
RETURNS TABLE (
  rank integer,
  user_id uuid,
  display_name text,
  username text,
  total_wager numeric,
  total_bets integer,
  prize numeric
)
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

  SELECT *
  INTO tournament
  FROM public.tournaments AS t
  WHERE t.id = _tournament_id;

  IF tournament.id IS NULL THEN
    RETURN;
  END IF;

  IF NOT tournament.is_active
     AND tournament.ends_at > now()
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH ranked AS (
    SELECT
      entries.user_id,
      entries.total_wager,
      entries.total_bets,
      (ROW_NUMBER() OVER (ORDER BY entries.total_wager DESC))::integer AS rank
    FROM public.tournament_entries AS entries
    WHERE entries.tournament_id = tournament.id
  )
  SELECT
    ranked.rank,
    ranked.user_id,
    profiles.display_name,
    profiles.username,
    ranked.total_wager,
    ranked.total_bets,
    CASE
      WHEN ranked.rank <= jsonb_array_length(tournament.prize_distribution)
           AND ranked.total_wager > 0
      THEN ROUND(
        tournament.prize_pool *
        COALESCE((tournament.prize_distribution ->> (ranked.rank - 1))::numeric, 0) / 100.0,
        2
      )
      ELSE 0
    END
  FROM ranked
  JOIN public.profiles AS profiles ON profiles.id = ranked.user_id
  ORDER BY ranked.rank
  LIMIT _limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tournament_leaderboard(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(uuid, integer) TO authenticated;