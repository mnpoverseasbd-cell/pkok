
-- Tournaments engine
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  game_id TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  prize_pool NUMERIC NOT NULL DEFAULT 0,
  prize_distribution JSONB NOT NULL DEFAULT '[50,25,15,10]'::jsonb,
  min_bet NUMERIC NOT NULL DEFAULT 0,
  capacity INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  finalized_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tournaments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;
GRANT ALL ON public.tournaments TO service_role;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "admins manage tournaments" ON public.tournaments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_tournaments_updated BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total_wager NUMERIC NOT NULL DEFAULT 0,
  total_bets INT NOT NULL DEFAULT 0,
  prize_awarded NUMERIC NOT NULL DEFAULT 0,
  final_rank INT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);
GRANT SELECT ON public.tournament_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_entries TO authenticated;
GRANT ALL ON public.tournament_entries TO service_role;
ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read entries" ON public.tournament_entries FOR SELECT USING (true);
CREATE POLICY "user joins self" ON public.tournament_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins manage entries" ON public.tournament_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_entries_updated BEFORE UPDATE ON public.tournament_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_entries_tournament_wager ON public.tournament_entries(tournament_id, total_wager DESC);

-- Auto-track wagers into active tournament entries when a bet is approved
CREATE OR REPLACE FUNCTION public.track_tournament_wager()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.type <> 'bet' OR NEW.status <> 'approved' THEN RETURN NEW; END IF;
  UPDATE public.tournament_entries te
    SET total_wager = te.total_wager + NEW.amount,
        total_bets = te.total_bets + 1
  FROM public.tournaments t
  WHERE te.tournament_id = t.id
    AND te.user_id = NEW.user_id
    AND t.is_active = true
    AND t.finalized_at IS NULL
    AND now() BETWEEN t.starts_at AND t.ends_at
    AND (t.game_id IS NULL OR t.game_id = NEW.game_id)
    AND NEW.amount >= t.min_bet;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_track_tournament_wager ON public.transactions;
CREATE TRIGGER trg_track_tournament_wager AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.track_tournament_wager();

-- Join tournament
CREATE OR REPLACE FUNCTION public.join_tournament(_tournament_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  uid UUID := auth.uid();
  t public.tournaments%ROWTYPE;
  cnt INT;
  entry_id UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO t FROM public.tournaments WHERE id = _tournament_id;
  IF t.id IS NULL THEN RAISE EXCEPTION 'tournament not found'; END IF;
  IF NOT t.is_active OR t.finalized_at IS NOT NULL THEN RAISE EXCEPTION 'tournament closed'; END IF;
  IF now() > t.ends_at THEN RAISE EXCEPTION 'tournament ended'; END IF;
  IF t.capacity IS NOT NULL THEN
    SELECT COUNT(*) INTO cnt FROM public.tournament_entries WHERE tournament_id = t.id;
    IF cnt >= t.capacity THEN RAISE EXCEPTION 'tournament full'; END IF;
  END IF;
  INSERT INTO public.tournament_entries (tournament_id, user_id)
  VALUES (t.id, uid)
  ON CONFLICT (tournament_id, user_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO entry_id;
  RETURN entry_id;
END;
$$;

-- Leaderboard from bet transactions
CREATE OR REPLACE FUNCTION public.get_wager_leaderboard(_period TEXT, _limit INT DEFAULT 50)
RETURNS TABLE(rank INT, user_id UUID, display_name TEXT, username TEXT, vip_tier TEXT, total_wager NUMERIC, total_bets INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH period AS (
    SELECT CASE WHEN _period='monthly' THEN now() - interval '30 days'
                WHEN _period='daily' THEN now() - interval '1 day'
                ELSE now() - interval '7 days' END AS since
  ),
  agg AS (
    SELECT t.user_id, SUM(t.amount) AS total_wager, COUNT(*)::int AS total_bets
    FROM public.transactions t, period
    WHERE t.type='bet' AND t.status='approved' AND t.created_at >= period.since
    GROUP BY t.user_id
  )
  SELECT (ROW_NUMBER() OVER (ORDER BY a.total_wager DESC))::int AS rank,
         a.user_id, p.display_name, p.username, p.vip_tier::text, a.total_wager, a.total_bets
  FROM agg a JOIN public.profiles p ON p.id = a.user_id
  ORDER BY a.total_wager DESC
  LIMIT _limit;
$$;

-- Tournament leaderboard
CREATE OR REPLACE FUNCTION public.get_tournament_leaderboard(_tournament_id UUID, _limit INT DEFAULT 100)
RETURNS TABLE(rank INT, user_id UUID, display_name TEXT, username TEXT, total_wager NUMERIC, total_bets INT, prize NUMERIC)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  t public.tournaments%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.tournaments WHERE id = _tournament_id;
  IF t.id IS NULL THEN RETURN; END IF;
  RETURN QUERY
  WITH ranked AS (
    SELECT te.user_id, te.total_wager, te.total_bets,
           (ROW_NUMBER() OVER (ORDER BY te.total_wager DESC))::int AS r
    FROM public.tournament_entries te
    WHERE te.tournament_id = t.id
  )
  SELECT r.r AS rank, r.user_id, p.display_name, p.username, r.total_wager, r.total_bets,
    CASE
      WHEN r.r <= jsonb_array_length(t.prize_distribution) AND r.total_wager > 0
      THEN ROUND(t.prize_pool * COALESCE((t.prize_distribution->>(r.r-1))::numeric,0) / 100.0, 2)
      ELSE 0
    END AS prize
  FROM ranked r JOIN public.profiles p ON p.id = r.user_id
  ORDER BY r.r
  LIMIT _limit;
END;
$$;

-- Finalize tournament: pay prizes
CREATE OR REPLACE FUNCTION public.finalize_tournament(_tournament_id UUID)
RETURNS TABLE(paid_users INT, total_paid NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  t public.tournaments%ROWTYPE;
  r RECORD;
  paid INT := 0;
  total NUMERIC := 0;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO t FROM public.tournaments WHERE id = _tournament_id FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'tournament not found'; END IF;
  IF t.finalized_at IS NOT NULL THEN RAISE EXCEPTION 'already finalized'; END IF;

  FOR r IN
    WITH ranked AS (
      SELECT te.id, te.user_id, te.total_wager,
             (ROW_NUMBER() OVER (ORDER BY te.total_wager DESC))::int AS rnk
      FROM public.tournament_entries te WHERE te.tournament_id = t.id
    )
    SELECT id, user_id, rnk,
      CASE WHEN rnk <= jsonb_array_length(t.prize_distribution) AND total_wager > 0
        THEN ROUND(t.prize_pool * COALESCE((t.prize_distribution->>(rnk-1))::numeric,0) / 100.0, 2)
        ELSE 0 END AS prize
    FROM ranked
  LOOP
    UPDATE public.tournament_entries SET final_rank = r.rnk, prize_awarded = r.prize WHERE id = r.id;
    IF r.prize > 0 THEN
      INSERT INTO public.transactions (user_id, type, status, amount, admin_note, approved_at)
      VALUES (r.user_id, 'bonus', 'approved', r.prize,
              'Tournament prize: ' || t.name || ' (rank ' || r.rnk || ')', now());
      UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance,0) + r.prize WHERE id = r.user_id;
      paid := paid + 1;
      total := total + r.prize;
    END IF;
  END LOOP;

  UPDATE public.tournaments SET finalized_at = now(), is_active = false WHERE id = t.id;
  RETURN QUERY SELECT paid, total;
END;
$$;

-- Seed a couple of live tournaments so the page has content immediately
INSERT INTO public.tournaments (name, description, game_id, starts_at, ends_at, prize_pool, prize_distribution, min_bet)
VALUES
  ('Weekly Wager Race', 'সপ্তাহজুড়ে সবচেয়ে বেশি বেট করে জিতুন প্রাইজ পুল থেকে ভাগ।', NULL,
   now() - interval '1 day', now() + interval '6 days', 50000, '[40,25,15,10,5,5]'::jsonb, 10),
  ('Crash Championship', 'শুধু Crash গেম — টপ ৫ জন পাবে প্রাইজ পুলের ভাগ।', 'crash',
   now(), now() + interval '3 days', 20000, '[50,25,15,10]'::jsonb, 20),
  ('Weekend Mines Cup', 'শুক্র-শনি জুড়ে Mines মাস্টারদের জন্য।', 'mines',
   now() + interval '2 days', now() + interval '5 days', 15000, '[50,30,20]'::jsonb, 10);
