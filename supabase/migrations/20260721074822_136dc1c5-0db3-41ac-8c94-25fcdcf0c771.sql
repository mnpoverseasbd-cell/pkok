
-- Restrict vip_tier_configs to authenticated
DROP POLICY IF EXISTS "Authenticated can view tier configs" ON public.vip_tier_configs;
CREATE POLICY "Authenticated can view tier configs" ON public.vip_tier_configs
  FOR SELECT TO authenticated USING (true);

-- Harden wallet_mutate: win/refund must reference a real bet in same round
CREATE OR REPLACE FUNCTION public.wallet_mutate(
  _type txn_type, _amount numeric,
  _game_id text DEFAULT NULL::text, _round_id text DEFAULT NULL::text, _note text DEFAULT NULL::text
) RETURNS TABLE(txn_id uuid, new_balance numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  current_balance numeric;
  next_balance numeric;
  new_txn_id uuid;
  bet_amount numeric;
  already_credited numeric;
  max_payout_multiplier CONSTANT numeric := 100000;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount IS NULL OR _amount = 0 THEN RAISE EXCEPTION 'amount required'; END IF;
  IF _type NOT IN ('bet','win','refund') THEN
    RAISE EXCEPTION 'wallet_mutate only supports bet/win/refund';
  END IF;

  IF _type = 'bet' AND _amount > 0 THEN _amount := -abs(_amount); END IF;
  IF _type IN ('win','refund') AND _amount < 0 THEN _amount := abs(_amount); END IF;

  -- Anti-fraud: win/refund must reference a real bet in the same round.
  IF _type IN ('win','refund') THEN
    IF _round_id IS NULL OR _game_id IS NULL THEN
      RAISE EXCEPTION 'round_id and game_id required for %', _type;
    END IF;
    SELECT amount INTO bet_amount FROM public.transactions
      WHERE user_id = uid AND type = 'bet' AND status = 'approved'
        AND round_id = _round_id AND game_id = _game_id
      LIMIT 1;
    IF bet_amount IS NULL THEN
      RAISE EXCEPTION 'no matching bet for round';
    END IF;
    SELECT COALESCE(SUM(amount), 0) INTO already_credited FROM public.transactions
      WHERE user_id = uid AND type IN ('win','refund') AND status = 'approved'
        AND round_id = _round_id AND game_id = _game_id;
    IF already_credited + abs(_amount) > bet_amount * max_payout_multiplier THEN
      RAISE EXCEPTION 'payout exceeds allowed cap for round';
    END IF;
  END IF;

  SELECT wallet_balance INTO current_balance FROM public.profiles WHERE id = uid FOR UPDATE;
  IF current_balance IS NULL THEN RAISE EXCEPTION 'profile not found'; END IF;

  next_balance := current_balance + _amount;
  IF next_balance < 0 THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  UPDATE public.profiles SET wallet_balance = next_balance WHERE id = uid;

  INSERT INTO public.transactions (user_id, type, status, amount, game_id, round_id, user_note, approved_at)
  VALUES (uid, _type, 'approved', abs(_amount), _game_id, _round_id, _note, now())
  RETURNING id INTO new_txn_id;

  RETURN QUERY SELECT new_txn_id, next_balance;
END;
$function$;
