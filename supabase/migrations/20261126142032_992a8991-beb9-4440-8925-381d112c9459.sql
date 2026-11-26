DROP FUNCTION IF EXISTS public.get_public_game_config(text);
DROP FUNCTION IF EXISTS public.get_public_vip_tier_benefits();

REVOKE SELECT ON TABLE
  public.feature_flags,
  public.game_configs,
  public.tournaments,
  public.tournament_entries
FROM anon;

DROP POLICY IF EXISTS "Admins can read all game configs" ON public.game_configs;
DROP POLICY IF EXISTS "Authenticated can view game configs" ON public.game_configs;
CREATE POLICY "Authenticated can read enabled game configs"
  ON public.game_configs
  FOR SELECT TO authenticated
  USING (is_enabled OR public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON TABLE public.vip_tier_configs FROM anon, authenticated;
GRANT SELECT (id, tier, min_deposit_total, cashback_pct, daily_bonus, weekly_bonus, sort_order)
  ON TABLE public.vip_tier_configs TO authenticated;

DROP POLICY IF EXISTS "Admins can manage tier configs" ON public.vip_tier_configs;
DROP POLICY IF EXISTS "Authenticated can read public VIP benefits" ON public.vip_tier_configs;
CREATE POLICY "Authenticated can read public VIP benefits"
  ON public.vip_tier_configs
  FOR SELECT TO authenticated
  USING (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond'));
CREATE POLICY "Admins can insert tier configs"
  ON public.vip_tier_configs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tier configs"
  ON public.vip_tier_configs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tier configs"
  ON public.vip_tier_configs
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.disabled_game_configs (
  game_key text PRIMARY KEY REFERENCES public.game_configs(game_key) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE public.disabled_game_configs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.disabled_game_configs TO authenticated;
GRANT ALL ON TABLE public.disabled_game_configs TO service_role;
ALTER TABLE public.disabled_game_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view disabled game keys"
  ON public.disabled_game_configs
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.sync_disabled_game_config()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.disabled_game_configs WHERE game_key = OLD.game_key;
    RETURN OLD;
  END IF;

  IF NEW.is_enabled THEN
    DELETE FROM public.disabled_game_configs WHERE game_key = NEW.game_key;
  ELSE
    INSERT INTO public.disabled_game_configs (game_key)
    VALUES (NEW.game_key)
    ON CONFLICT (game_key)
    DO UPDATE SET updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_disabled_game_config() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_sync_disabled_game_config
  AFTER INSERT OR UPDATE OR DELETE ON public.game_configs
  FOR EACH ROW EXECUTE FUNCTION public.sync_disabled_game_config();

INSERT INTO public.disabled_game_configs (game_key)
SELECT game_key
FROM public.game_configs
WHERE NOT is_enabled
ON CONFLICT (game_key) DO UPDATE SET updated_at = now();

DROP POLICY IF EXISTS "admins manage tournaments" ON public.tournaments;
CREATE POLICY "Admins can insert tournaments"
  ON public.tournaments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tournaments"
  ON public.tournaments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tournaments"
  ON public.tournaments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins manage entries" ON public.tournament_entries;
DROP POLICY IF EXISTS "user joins self" ON public.tournament_entries;
DROP POLICY IF EXISTS "Users can read own tournament entries" ON public.tournament_entries;
CREATE POLICY "Users can read own or admins all tournament entries"
  ON public.tournament_entries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users and admins can insert tournament entries"
  ON public.tournament_entries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tournament entries"
  ON public.tournament_entries
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tournament entries"
  ON public.tournament_entries
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));