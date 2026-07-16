ALTER TYPE public.txn_type ADD VALUE IF NOT EXISTS 'bet';
ALTER TYPE public.txn_type ADD VALUE IF NOT EXISTS 'win';
ALTER TYPE public.txn_type ADD VALUE IF NOT EXISTS 'refund';

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS round_id text,
  ADD COLUMN IF NOT EXISTS game_id text;

CREATE INDEX IF NOT EXISTS transactions_round_idx ON public.transactions (round_id) WHERE round_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transactions_game_idx ON public.transactions (game_id) WHERE game_id IS NOT NULL;

-- Atomic wallet mutation for game rounds (self-service, RLS-safe).
-- Positive amount = credit (win/refund/bonus). Negative amount = debit (bet).
CREATE OR REPLACE FUNCTION public.wallet_mutate(
  _type public.txn_type,
  _amount numeric,
  _game_id text DEFAULT NULL,
  _round_id text DEFAULT NULL,
  _note text DEFAULT NULL
) RETURNS TABLE(txn_id uuid, new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  current_balance numeric;
  next_balance numeric;
  new_txn_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _amount IS NULL OR _amount = 0 THEN
    RAISE EXCEPTION 'amount required';
  END IF;
  IF _type NOT IN ('bet','win','refund') THEN
    RAISE EXCEPTION 'wallet_mutate only supports bet/win/refund';
  END IF;
  IF _type = 'bet' AND _amount > 0 THEN
    _amount := -abs(_amount);
  END IF;
  IF _type IN ('win','refund') AND _amount < 0 THEN
    _amount := abs(_amount);
  END IF;

  SELECT wallet_balance INTO current_balance FROM public.profiles WHERE id = uid FOR UPDATE;
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  next_balance := current_balance + _amount;
  IF next_balance < 0 THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;

  UPDATE public.profiles SET wallet_balance = next_balance WHERE id = uid;

  INSERT INTO public.transactions (user_id, type, status, amount, game_id, round_id, user_note, approved_at)
  VALUES (uid, _type, 'approved', abs(_amount), _game_id, _round_id, _note, now())
  RETURNING id INTO new_txn_id;

  RETURN QUERY SELECT new_txn_id, next_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.wallet_mutate(public.txn_type, numeric, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wallet_mutate(public.txn_type, numeric, text, text, text) TO authenticated;
