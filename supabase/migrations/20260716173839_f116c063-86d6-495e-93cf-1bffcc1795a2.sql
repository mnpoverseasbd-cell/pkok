
CREATE OR REPLACE FUNCTION public.preview_daily_bonuses()
RETURNS TABLE(user_id uuid, tier text, amount numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.vip_tier::text, c.daily_bonus
  FROM public.profiles p
  JOIN public.vip_tier_configs c ON c.tier = p.vip_tier::text
  WHERE (p.last_daily_bonus_at IS NULL OR p.last_daily_bonus_at < now() - interval '20 hours')
    AND COALESCE(c.daily_bonus, 0) > 0;
$$;

CREATE OR REPLACE FUNCTION public.preview_weekly_bonuses()
RETURNS TABLE(user_id uuid, tier text, amount numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.vip_tier::text, c.weekly_bonus
  FROM public.profiles p
  JOIN public.vip_tier_configs c ON c.tier = p.vip_tier::text
  WHERE (p.last_weekly_bonus_at IS NULL OR p.last_weekly_bonus_at < now() - interval '6 days 20 hours')
    AND COALESCE(c.weekly_bonus, 0) > 0;
$$;

CREATE OR REPLACE FUNCTION public.preview_daily_cashback()
RETURNS TABLE(user_id uuid, tier text, cashback_pct numeric, yday_deposits numeric, amount numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id,
    p.vip_tier::text,
    c.cashback_pct,
    COALESCE((
      SELECT SUM(amount) FROM public.transactions t
      WHERE t.user_id = p.id AND t.type='deposit' AND t.status='approved'
        AND t.approved_at >= (current_date - interval '1 day')
        AND t.approved_at <  current_date
    ), 0) AS yday_deposits,
    ROUND(COALESCE((
      SELECT SUM(amount) FROM public.transactions t
      WHERE t.user_id = p.id AND t.type='deposit' AND t.status='approved'
        AND t.approved_at >= (current_date - interval '1 day')
        AND t.approved_at <  current_date
    ), 0) * c.cashback_pct / 100.0, 2) AS amount
  FROM public.profiles p
  JOIN public.vip_tier_configs c ON c.tier = p.vip_tier::text
  WHERE (p.last_cashback_at IS NULL OR p.last_cashback_at < now() - interval '20 hours')
    AND COALESCE(c.cashback_pct, 0) > 0;
$$;

REVOKE ALL ON FUNCTION public.preview_daily_bonuses() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.preview_weekly_bonuses() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.preview_daily_cashback() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.preview_daily_bonuses() TO service_role;
GRANT EXECUTE ON FUNCTION public.preview_weekly_bonuses() TO service_role;
GRANT EXECUTE ON FUNCTION public.preview_daily_cashback() TO service_role;
