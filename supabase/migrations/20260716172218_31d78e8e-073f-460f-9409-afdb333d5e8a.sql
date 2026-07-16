
-- Track last-claim timestamps
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_daily_bonus_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_weekly_bonus_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_cashback_at timestamptz;

-- === Daily bonus payout ===
CREATE OR REPLACE FUNCTION public.run_daily_bonuses()
RETURNS TABLE(credited_users int, total_amount numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r record;
  amt numeric;
  users_cnt int := 0;
  total numeric := 0;
BEGIN
  FOR r IN
    SELECT p.id, p.vip_tier, c.daily_bonus
    FROM public.profiles p
    JOIN public.vip_tier_configs c ON c.tier = p.vip_tier::text
    WHERE (p.last_daily_bonus_at IS NULL OR p.last_daily_bonus_at < now() - interval '20 hours')
      AND COALESCE(c.daily_bonus, 0) > 0
  LOOP
    amt := r.daily_bonus;
    INSERT INTO public.transactions (user_id, type, status, amount, admin_note, approved_at)
    VALUES (r.id, 'bonus', 'approved', amt, 'VIP daily bonus (' || r.vip_tier || ')', now());
    UPDATE public.profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + amt,
          last_daily_bonus_at = now()
    WHERE id = r.id;
    users_cnt := users_cnt + 1;
    total := total + amt;
  END LOOP;
  RETURN QUERY SELECT users_cnt, total;
END;
$$;

-- === Weekly bonus payout ===
CREATE OR REPLACE FUNCTION public.run_weekly_bonuses()
RETURNS TABLE(credited_users int, total_amount numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r record;
  amt numeric;
  users_cnt int := 0;
  total numeric := 0;
BEGIN
  FOR r IN
    SELECT p.id, p.vip_tier, c.weekly_bonus
    FROM public.profiles p
    JOIN public.vip_tier_configs c ON c.tier = p.vip_tier::text
    WHERE (p.last_weekly_bonus_at IS NULL OR p.last_weekly_bonus_at < now() - interval '6 days 20 hours')
      AND COALESCE(c.weekly_bonus, 0) > 0
  LOOP
    amt := r.weekly_bonus;
    INSERT INTO public.transactions (user_id, type, status, amount, admin_note, approved_at)
    VALUES (r.id, 'bonus', 'approved', amt, 'VIP weekly bonus (' || r.vip_tier || ')', now());
    UPDATE public.profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + amt,
          last_weekly_bonus_at = now()
    WHERE id = r.id;
    users_cnt := users_cnt + 1;
    total := total + amt;
  END LOOP;
  RETURN QUERY SELECT users_cnt, total;
END;
$$;

-- === Daily cashback payout ===
-- Cashback = tier.cashback_pct% of yesterday's approved deposits (proxy for turnover until bets tracking exists)
CREATE OR REPLACE FUNCTION public.run_daily_cashback()
RETURNS TABLE(credited_users int, total_amount numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r record;
  amt numeric;
  users_cnt int := 0;
  total numeric := 0;
BEGIN
  FOR r IN
    SELECT p.id, p.vip_tier, c.cashback_pct,
      COALESCE((
        SELECT SUM(amount) FROM public.transactions t
        WHERE t.user_id = p.id AND t.type='deposit' AND t.status='approved'
          AND t.approved_at >= (current_date - interval '1 day')
          AND t.approved_at <  current_date
      ), 0) AS yday_deposits
    FROM public.profiles p
    JOIN public.vip_tier_configs c ON c.tier = p.vip_tier::text
    WHERE (p.last_cashback_at IS NULL OR p.last_cashback_at < now() - interval '20 hours')
      AND COALESCE(c.cashback_pct, 0) > 0
  LOOP
    amt := ROUND(r.yday_deposits * r.cashback_pct / 100.0, 2);
    IF amt > 0 THEN
      INSERT INTO public.transactions (user_id, type, status, amount, admin_note, approved_at)
      VALUES (r.id, 'cashback', 'approved', amt,
              'VIP cashback ' || r.cashback_pct || '% (' || r.vip_tier || ')', now());
      UPDATE public.profiles
        SET wallet_balance = COALESCE(wallet_balance, 0) + amt,
            last_cashback_at = now()
      WHERE id = r.id;
      users_cnt := users_cnt + 1;
      total := total + amt;
    ELSE
      UPDATE public.profiles SET last_cashback_at = now() WHERE id = r.id;
    END IF;
  END LOOP;
  RETURN QUERY SELECT users_cnt, total;
END;
$$;

-- Lock down: only service_role (used by cron/edge) can execute
REVOKE EXECUTE ON FUNCTION public.run_daily_bonuses()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_weekly_bonuses() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_daily_cashback() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.run_daily_bonuses()  TO service_role;
GRANT  EXECUTE ON FUNCTION public.run_weekly_bonuses() TO service_role;
GRANT  EXECUTE ON FUNCTION public.run_daily_cashback() TO service_role;
