
INSERT INTO public.feature_flags (flag_key, enabled, metadata, description)
VALUES ('referral_commission_pct', true, '{"pct": 2}'::jsonb, 'Referral commission percentage on referred user deposit approvals')
ON CONFLICT (flag_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_txn_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  deposit_amount numeric NOT NULL,
  commission_pct numeric NOT NULL,
  commission_amount numeric NOT NULL,
  payout_txn_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ref_comm_referrer ON public.referral_commissions(referrer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ref_comm_referred ON public.referral_commissions(referred_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ref_comm_source_uniq ON public.referral_commissions(source_txn_id) WHERE source_txn_id IS NOT NULL;

GRANT SELECT ON public.referral_commissions TO authenticated;
GRANT ALL ON public.referral_commissions TO service_role;

ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own commissions"
ON public.referral_commissions FOR SELECT
TO authenticated
USING (referrer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages commissions"
ON public.referral_commissions FOR ALL
TO service_role
USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.pay_referral_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  referrer uuid;
  pct numeric;
  commission numeric;
  payout_id uuid;
BEGIN
  IF NEW.type <> 'deposit' OR NEW.status <> 'approved' THEN RETURN NEW; END IF;
  IF OLD IS NOT NULL AND OLD.status = 'approved' THEN RETURN NEW; END IF;

  SELECT referred_by INTO referrer FROM public.profiles WHERE id = NEW.user_id;
  IF referrer IS NULL THEN RETURN NEW; END IF;

  SELECT COALESCE((metadata->>'pct')::numeric, 2) INTO pct
  FROM public.feature_flags WHERE flag_key = 'referral_commission_pct' AND enabled = true;
  IF pct IS NULL OR pct <= 0 THEN RETURN NEW; END IF;

  commission := ROUND(NEW.amount * pct / 100.0, 2);
  IF commission <= 0 THEN RETURN NEW; END IF;

  IF EXISTS (SELECT 1 FROM public.referral_commissions WHERE source_txn_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.transactions (user_id, type, status, amount, admin_note, approved_at)
  VALUES (referrer, 'bonus', 'approved', commission,
          'Referral commission (' || pct || '%) from deposit', now())
  RETURNING id INTO payout_id;

  UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + commission
    WHERE id = referrer;

  INSERT INTO public.referral_commissions
    (referrer_id, referred_id, source_txn_id, deposit_amount, commission_pct, commission_amount, payout_txn_id)
  VALUES (referrer, NEW.user_id, NEW.id, NEW.amount, pct, commission, payout_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pay_referral_commission ON public.transactions;
CREATE TRIGGER trg_pay_referral_commission
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.pay_referral_commission();
