ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_by_admin uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Browser sessions can no longer mutate wallet ledgers directly. This also pauses wagers until server-verified game settlement exists.
REVOKE EXECUTE ON FUNCTION public.wallet_mutate(public.txn_type, numeric, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_mutate(public.txn_type, numeric, text, text, text) TO service_role;

-- Game odds and payout controls are immutable after initial creation.
CREATE OR REPLACE FUNCTION public.prevent_game_odds_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.house_edge := 0.04;
    NEW.config := COALESCE(NEW.config, '{}'::jsonb) || jsonb_build_object(
      'win_rate_pct', 50,
      'payout_multiplier', 1,
      'max_payout_mult', 0
    );
    RETURN NEW;
  END IF;

  IF NEW.house_edge IS DISTINCT FROM OLD.house_edge
    OR NEW.config -> 'win_rate_pct' IS DISTINCT FROM OLD.config -> 'win_rate_pct'
    OR NEW.config -> 'payout_multiplier' IS DISTINCT FROM OLD.config -> 'payout_multiplier'
    OR NEW.config -> 'max_payout_mult' IS DISTINCT FROM OLD.config -> 'max_payout_mult'
  THEN
    RAISE EXCEPTION 'Game odds and payout settings are locked';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_game_odds_changes() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_prevent_game_odds_changes ON public.game_configs;
CREATE TRIGGER trg_prevent_game_odds_changes
  BEFORE INSERT OR UPDATE ON public.game_configs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_game_odds_changes();

-- Fixed, tier-specific ceilings preserve existing rewards but prevent increases.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.vip_tier_configs'::regclass
      AND conname = 'vip_tier_reward_caps'
  ) THEN
    ALTER TABLE public.vip_tier_configs
      ADD CONSTRAINT vip_tier_reward_caps CHECK (
        daily_bonus >= 0 AND weekly_bonus >= 0 AND cashback_pct >= 0 AND
        CASE tier::text
          WHEN 'bronze' THEN daily_bonus <= 10 AND weekly_bonus <= 50 AND cashback_pct <= 1
          WHEN 'silver' THEN daily_bonus <= 25 AND weekly_bonus <= 150 AND cashback_pct <= 2
          WHEN 'gold' THEN daily_bonus <= 60 AND weekly_bonus <= 400 AND cashback_pct <= 4
          WHEN 'platinum' THEN daily_bonus <= 150 AND weekly_bonus <= 1000 AND cashback_pct <= 6
          WHEN 'diamond' THEN daily_bonus <= 400 AND weekly_bonus <= 3000 AND cashback_pct <= 10
          ELSE false
        END
      );
  END IF;
END;
$$;

-- Reject direct authenticated approval of a deposit into the acting admin's own or self-created account.
CREATE OR REPLACE FUNCTION public.prevent_admin_self_deposit_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor_id uuid := auth.uid();
  creator_id uuid;
BEGIN
  IF TG_OP = 'UPDATE'
    AND NEW.type = 'deposit'
    AND NEW.status = 'approved'
    AND OLD.status IS DISTINCT FROM 'approved'::public.txn_status
    AND actor_id IS NOT NULL
  THEN
    SELECT p.created_by_admin INTO creator_id
    FROM public.profiles AS p
    WHERE p.id = NEW.user_id;

    IF actor_id = NEW.user_id OR actor_id = creator_id THEN
      RAISE EXCEPTION 'Admins cannot approve deposits for their own accounts';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_admin_self_deposit_approval() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_prevent_admin_self_deposit_approval ON public.transactions;
CREATE TRIGGER trg_prevent_admin_self_deposit_approval
  BEFORE UPDATE OF status ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_self_deposit_approval();

-- A free-credit offer cannot be claimed by its creator or by an account they created.
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
  creator_id uuid;
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
    SELECT created_by_admin INTO creator_id FROM public.profiles WHERE id = uid;
    IF p.created_by = uid OR (creator_id IS NOT NULL AND p.created_by = creator_id) THEN
      RAISE EXCEPTION 'Offer creators cannot claim their own free credit';
    END IF;
    amt := p.bonus_fixed;
    IF amt <= 0 THEN RAISE EXCEPTION 'বোনাস কনফিগ ভুল'; END IF;
    wreq := amt * p.wagering_multiplier;
    INSERT INTO public.user_promotions (user_id, promotion_id, granted_amount, wagering_required, status)
      VALUES (uid, p.id, amt, wreq, 'active')
      RETURNING id INTO new_id;
    UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance, 0) + amt WHERE id = uid;
    INSERT INTO public.transactions (user_id, type, status, amount, admin_note, approved_at)
      VALUES (uid, 'bonus', 'approved', amt, 'Promo: ' || p.name, now());
    RETURN QUERY SELECT new_id, amt, wreq, 'বোনাস যোগ হয়েছে'::text;
  ELSIF p.type = 'deposit_bonus' THEN
    INSERT INTO public.user_promotions (user_id, promotion_id, granted_amount, wagering_required, status)
      VALUES (uid, p.id, 0, 0, 'active')
      RETURNING id INTO new_id;
    RETURN QUERY SELECT new_id, 0::numeric, 0::numeric, 'পরবর্তী ডিপোজিটে বোনাস যোগ হবে'::text;
  ELSE
    RAISE EXCEPTION 'এই ধরনের প্রোমো কোড দিয়ে ক্লেইম করা যায় না';
  END IF;
END;
$$;
