
CREATE TABLE public.vip_tier_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL UNIQUE,
  min_deposit_total numeric NOT NULL DEFAULT 0,
  cashback_pct numeric NOT NULL DEFAULT 0,
  daily_bonus numeric NOT NULL DEFAULT 0,
  weekly_bonus numeric NOT NULL DEFAULT 0,
  min_deposit_amount numeric NOT NULL DEFAULT 100,
  max_deposit_amount numeric NOT NULL DEFAULT 25000,
  min_withdraw_amount numeric NOT NULL DEFAULT 500,
  max_withdraw_amount numeric NOT NULL DEFAULT 25000,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vip_tier_configs TO anon, authenticated;
GRANT ALL ON public.vip_tier_configs TO service_role;
ALTER TABLE public.vip_tier_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tier configs" ON public.vip_tier_configs
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage tier configs" ON public.vip_tier_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER vip_tier_configs_updated_at
  BEFORE UPDATE ON public.vip_tier_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.vip_tier_configs (tier, min_deposit_total, cashback_pct, daily_bonus, weekly_bonus, min_deposit_amount, max_deposit_amount, min_withdraw_amount, max_withdraw_amount, sort_order) VALUES
  ('bronze',   0,        1, 10,  50,   100,  25000,  500,  25000, 1),
  ('silver',   10000,    2, 25,  150,  100,  50000,  500,  50000, 2),
  ('gold',     50000,    4, 60,  400,  100, 100000,  500, 100000, 3),
  ('platinum', 200000,   6, 150, 1000, 100, 250000,  500, 250000, 4),
  ('diamond',  1000000, 10, 400, 3000, 100, 500000,  500, 500000, 5);

CREATE OR REPLACE FUNCTION public.recompute_vip_tier(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_dep numeric;
  new_tier text;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_dep
  FROM public.transactions
  WHERE user_id = _user_id AND type = 'deposit' AND status = 'approved';

  SELECT tier INTO new_tier
  FROM public.vip_tier_configs
  WHERE min_deposit_total <= total_dep
  ORDER BY min_deposit_total DESC
  LIMIT 1;

  IF new_tier IS NOT NULL THEN
    UPDATE public.profiles
    SET vip_tier = new_tier::vip_tier
    WHERE id = _user_id AND vip_tier::text <> new_tier;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_txn_recompute_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'deposit' AND NEW.status = 'approved' THEN
    PERFORM public.recompute_vip_tier(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_txn_recompute_tier ON public.transactions;
CREATE TRIGGER trg_txn_recompute_tier
  AFTER INSERT OR UPDATE OF status ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.on_txn_recompute_tier();

DO $$
DECLARE u record;
BEGIN
  FOR u IN SELECT id FROM public.profiles LOOP
    PERFORM public.recompute_vip_tier(u.id);
  END LOOP;
END $$;
