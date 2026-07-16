CREATE TABLE public.game_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  min_bet NUMERIC NOT NULL DEFAULT 10,
  max_bet NUMERIC NOT NULL DEFAULT 10000,
  house_edge NUMERIC NOT NULL DEFAULT 0.02,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.game_configs TO anon, authenticated;
GRANT ALL ON public.game_configs TO service_role;

ALTER TABLE public.game_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game configs"
  ON public.game_configs FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert game configs"
  ON public.game_configs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update game configs"
  ON public.game_configs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete game configs"
  ON public.game_configs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_game_configs_updated_at
  BEFORE UPDATE ON public.game_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default configs for the 7 internal games
INSERT INTO public.game_configs (game_key, name, min_bet, max_bet, house_edge, config) VALUES
  ('mines',    'Mines',     10, 10000, 0.02, '{"max_mines": 24, "default_mines": 3}'::jsonb),
  ('dice',     'Dice',      10, 10000, 0.02, '{"min_chance": 2, "max_chance": 98}'::jsonb),
  ('crash',    'Crash',     10, 10000, 0.02, '{"max_multiplier": 100}'::jsonb),
  ('limbo',    'Limbo',     10, 10000, 0.02, '{"max_multiplier": 1000000}'::jsonb),
  ('plinko',   'Plinko',    10, 10000, 0.02, '{"rows": 16, "risk_levels": ["low","medium","high"]}'::jsonb),
  ('wheel',    'Wheel',     10, 10000, 0.02, '{"segments": 20}'::jsonb),
  ('coinflip', 'Coin Flip', 10, 10000, 0.02, '{"payout": 1.98}'::jsonb);