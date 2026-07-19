
-- ============ PROMOTIONS ============
CREATE TYPE public.promo_type AS ENUM ('deposit_bonus', 'free_credit', 'cashback');
CREATE TYPE public.user_promo_status AS ENUM ('active', 'completed', 'expired', 'cancelled');

CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  code text UNIQUE,
  type public.promo_type NOT NULL DEFAULT 'deposit_bonus',
  bonus_pct numeric NOT NULL DEFAULT 0,
  bonus_fixed numeric NOT NULL DEFAULT 0,
  min_deposit numeric NOT NULL DEFAULT 0,
  max_bonus numeric NOT NULL DEFAULT 0,
  wagering_multiplier numeric NOT NULL DEFAULT 1,
  max_uses_total integer,
  max_uses_per_user integer NOT NULL DEFAULT 1,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read active promos" ON public.promotions FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage promos" ON public.promotions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER promotions_updated BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  granted_amount numeric NOT NULL DEFAULT 0,
  wagering_required numeric NOT NULL DEFAULT 0,
  wagering_progress numeric NOT NULL DEFAULT 0,
  status public.user_promo_status NOT NULL DEFAULT 'active',
  source_txn_id uuid,
  activated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_promotions_user_status_idx ON public.user_promotions (user_id, status);
GRANT SELECT ON public.user_promotions TO authenticated;
GRANT ALL ON public.user_promotions TO service_role;
ALTER TABLE public.user_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads own promos" ON public.user_promotions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage user promos" ON public.user_promotions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER user_promotions_updated BEFORE UPDATE ON public.user_promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CLAIM PROMO CODE ============
CREATE OR REPLACE FUNCTION public.claim_promo_code(_code text)
RETURNS TABLE(user_promotion_id uuid, granted_amount numeric, wagering_required numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  p public.promotions%ROWTYPE;
  used_by_user int;
  used_total int;
  amt numeric;
  wreq numeric;
  new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO p FROM public.promotions WHERE code = _code AND is_active = true;
  IF p.id IS NULL THEN RAISE EXCEPTION 'অবৈধ কোড'; END IF;
  IF p.valid_from IS NOT NULL AND now() < p.valid_from THEN RAISE EXCEPTION 'এখনও শুরু হয়নি'; END IF;
  IF p.valid_until IS NOT NULL AND now() > p.valid_until THEN RAISE EXCEPTION 'কোডের মেয়াদ শেষ'; END IF;

  SELECT COUNT(*) INTO used_by_user FROM public.user_promotions WHERE user_id = uid AND promotion_id = p.id;
  IF used_by_user >= p.max_uses_per_user THEN RAISE EXCEPTION 'আপনি ইতিমধ্যে ব্যবহার করেছেন'; END IF;

  IF p.max_uses_total IS NOT NULL THEN
    SELECT COUNT(*) INTO used_total FROM public.user_promotions WHERE promotion_id = p.id;
    IF used_total >= p.max_uses_total THEN RAISE EXCEPTION 'কোডের সীমা শেষ'; END IF;
  END IF;

  IF p.type = 'free_credit' THEN
    amt := p.bonus_fixed;
    IF amt <= 0 THEN RAISE EXCEPTION 'বোনাস কনফিগ ভুল'; END IF;
    wreq := amt * p.wagering_multiplier;
    INSERT INTO public.user_promotions (user_id, promotion_id, granted_amount, wagering_required, status)
    VALUES (uid, p.id, amt, wreq, 'active')
    RETURNING id INTO new_id;
    -- credit wallet
    UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance,0) + amt WHERE id = uid;
    INSERT INTO public.transactions (user_id, type, status, amount, admin_note, approved_at)
    VALUES (uid, 'bonus', 'approved', amt, 'Promo: ' || p.name, now());
    RETURN QUERY SELECT new_id, amt, wreq, 'বোনাস যোগ হয়েছে'::text;
  ELSIF p.type = 'deposit_bonus' THEN
    -- Store as pending (activates on next deposit)
    INSERT INTO public.user_promotions (user_id, promotion_id, granted_amount, wagering_required, status)
    VALUES (uid, p.id, 0, 0, 'active')
    RETURNING id INTO new_id;
    RETURN QUERY SELECT new_id, 0::numeric, 0::numeric, 'পরবর্তী ডিপোজিটে বোনাস যোগ হবে'::text;
  ELSE
    RAISE EXCEPTION 'এই ধরনের প্রোমো কোড দিয়ে ক্লেইম করা যায় না';
  END IF;
END;
$$;

-- ============ AUTO DEPOSIT BONUS ============
CREATE OR REPLACE FUNCTION public.apply_deposit_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  up record;
  p public.promotions%ROWTYPE;
  bonus numeric;
  wreq numeric;
BEGIN
  IF NEW.type <> 'deposit' OR NEW.status <> 'approved' THEN RETURN NEW; END IF;
  IF OLD IS NOT NULL AND OLD.status = 'approved' THEN RETURN NEW; END IF;

  -- Find pending deposit_bonus for this user (granted_amount=0 signals pending)
  FOR up IN
    SELECT up.*, pr.* AS promo
    FROM public.user_promotions up
    JOIN public.promotions pr ON pr.id = up.promotion_id
    WHERE up.user_id = NEW.user_id
      AND up.status = 'active'
      AND up.granted_amount = 0
      AND pr.type = 'deposit_bonus'
      AND pr.is_active = true
      AND (pr.valid_from IS NULL OR now() >= pr.valid_from)
      AND (pr.valid_until IS NULL OR now() <= pr.valid_until)
      AND NEW.amount >= pr.min_deposit
    ORDER BY up.created_at ASC
    LIMIT 1
  LOOP
    SELECT * INTO p FROM public.promotions WHERE id = up.promotion_id;
    bonus := ROUND(NEW.amount * p.bonus_pct / 100.0, 2);
    IF p.max_bonus > 0 AND bonus > p.max_bonus THEN bonus := p.max_bonus; END IF;
    IF bonus <= 0 THEN RETURN NEW; END IF;
    wreq := bonus * p.wagering_multiplier;

    UPDATE public.user_promotions
      SET granted_amount = bonus, wagering_required = wreq, source_txn_id = NEW.id
      WHERE id = up.id;
    UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance,0) + bonus WHERE id = NEW.user_id;
    INSERT INTO public.transactions (user_id, type, status, amount, admin_note, approved_at)
    VALUES (NEW.user_id, 'bonus', 'approved', bonus, 'Deposit bonus: ' || p.name, now());
  END LOOP;

  RETURN NEW;
END;
$$;

-- ============ WAGERING TRACKING ============
CREATE OR REPLACE FUNCTION public.track_wagering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type <> 'bet' OR NEW.status <> 'approved' THEN RETURN NEW; END IF;
  UPDATE public.user_promotions
    SET wagering_progress = wagering_progress + NEW.amount,
        status = CASE WHEN wagering_progress + NEW.amount >= wagering_required AND wagering_required > 0
                      THEN 'completed'::user_promo_status
                      ELSE status END,
        completed_at = CASE WHEN wagering_progress + NEW.amount >= wagering_required AND wagering_required > 0 AND completed_at IS NULL
                            THEN now() ELSE completed_at END
    WHERE user_id = NEW.user_id AND status = 'active' AND granted_amount > 0;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_apply_deposit_bonus
  AFTER INSERT OR UPDATE OF status ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.apply_deposit_bonus();

CREATE TRIGGER trg_track_wagering
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.track_wagering();
