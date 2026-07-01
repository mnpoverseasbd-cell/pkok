
-- ============ ENUMS ============
CREATE TYPE public.txn_type AS ENUM ('deposit','withdraw','adjustment','bonus');
CREATE TYPE public.txn_status AS ENUM ('pending','approved','rejected','cancelled');
CREATE TYPE public.pm_kind AS ENUM ('bkash','nagad','rocket','bank','usdt','other');

-- ============ PAYMENT METHODS ============
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.pm_kind NOT NULL,
  label text NOT NULL,
  account_number text NOT NULL,
  instructions text,
  min_deposit numeric NOT NULL DEFAULT 100,
  min_withdraw numeric NOT NULL DEFAULT 500,
  is_active boolean NOT NULL DEFAULT true,
  supports_deposit boolean NOT NULL DEFAULT true,
  supports_withdraw boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active payment methods"
  ON public.payment_methods FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage payment methods"
  ON public.payment_methods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER pm_set_updated_at BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ TRANSACTIONS ============
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.txn_type NOT NULL,
  status public.txn_status NOT NULL DEFAULT 'pending',
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method_id uuid REFERENCES public.payment_methods(id),
  sender_account text,
  receiver_account text,
  txn_reference text,
  user_note text,
  admin_note text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_txn_user ON public.transactions(user_id, created_at DESC);
CREATE INDEX idx_txn_status ON public.transactions(status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can see their own
CREATE POLICY "Users view own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Users can create pending deposit/withdraw requests for themselves
CREATE POLICY "Users create own requests"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND type IN ('deposit','withdraw')
    AND approved_by IS NULL
    AND approved_at IS NULL
  );

-- Users can cancel their own pending requests
CREATE POLICY "Users cancel own pending"
  ON public.transactions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Admins full access
CREATE POLICY "Admins manage all transactions"
  ON public.transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER txn_set_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ BALANCE APPLY TRIGGER ============
CREATE OR REPLACE FUNCTION public.apply_transaction_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delta numeric := 0;
  cur_balance numeric;
BEGIN
  -- Only act when moving into approved for the first time
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    IF NEW.type = 'deposit' OR NEW.type = 'bonus' THEN
      delta := NEW.amount;
    ELSIF NEW.type = 'withdraw' THEN
      delta := -NEW.amount;
    ELSIF NEW.type = 'adjustment' THEN
      delta := NEW.amount; -- amount can be signed via separate admin flow if needed
    END IF;

    SELECT wallet_balance INTO cur_balance FROM public.profiles WHERE id = NEW.user_id FOR UPDATE;
    IF cur_balance + delta < 0 THEN
      RAISE EXCEPTION 'Insufficient balance for withdrawal';
    END IF;

    UPDATE public.profiles
      SET wallet_balance = wallet_balance + delta,
          updated_at = now()
      WHERE id = NEW.user_id;

    NEW.approved_at := COALESCE(NEW.approved_at, now());
  END IF;

  RETURN NEW;
END;
$$;

-- Balance trigger must bypass the profile-protection trigger
-- (SECURITY DEFINER runs as function owner; protect trigger checks has_role of auth.uid,
--  so we temporarily disable via a session flag pattern). Simpler: drop the protect trigger's
--  effect for this path by having the protect function allow updates when session var is set.
-- We update the protect function to allow when a GUC is set by this function.

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow when running inside apply_transaction_balance (bypass flag)
  IF current_setting('app.bypass_profile_protect', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
    RAISE EXCEPTION 'wallet_balance cannot be changed by user';
  END IF;
  IF NEW.vip_tier IS DISTINCT FROM OLD.vip_tier THEN
    RAISE EXCEPTION 'vip_tier cannot be changed by user';
  END IF;
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    RAISE EXCEPTION 'referral_code cannot be changed';
  END IF;
  IF NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'referred_by cannot be changed';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'id cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

-- Rewrite apply function to set the bypass flag around the update
CREATE OR REPLACE FUNCTION public.apply_transaction_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delta numeric := 0;
  cur_balance numeric;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    IF NEW.type = 'deposit' OR NEW.type = 'bonus' THEN
      delta := NEW.amount;
    ELSIF NEW.type = 'withdraw' THEN
      delta := -NEW.amount;
    ELSIF NEW.type = 'adjustment' THEN
      delta := NEW.amount;
    END IF;

    SELECT wallet_balance INTO cur_balance FROM public.profiles WHERE id = NEW.user_id FOR UPDATE;
    IF cur_balance + delta < 0 THEN
      RAISE EXCEPTION 'Insufficient balance for withdrawal';
    END IF;

    PERFORM set_config('app.bypass_profile_protect','on', true);
    UPDATE public.profiles
      SET wallet_balance = wallet_balance + delta,
          updated_at = now()
      WHERE id = NEW.user_id;
    PERFORM set_config('app.bypass_profile_protect','off', true);

    NEW.approved_at := COALESCE(NEW.approved_at, now());
    NEW.approved_by := COALESCE(NEW.approved_by, auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the profile-protect trigger actually exists on profiles
DROP TRIGGER IF EXISTS profile_protect ON public.profiles;
CREATE TRIGGER profile_protect
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- Attach balance trigger to transactions
DROP TRIGGER IF EXISTS txn_apply_balance ON public.transactions;
CREATE TRIGGER txn_apply_balance
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.apply_transaction_balance();

-- Also ensure handle_new_user trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
