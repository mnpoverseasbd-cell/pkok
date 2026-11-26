DROP TRIGGER IF EXISTS trg_sync_disabled_game_config ON public.game_configs;
DROP FUNCTION IF EXISTS public.sync_disabled_game_config();
DROP TABLE public.disabled_game_configs;

CREATE OR REPLACE FUNCTION public.sync_game_disabled_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  status_key text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.feature_flags
    SET enabled = false, updated_at = now()
    WHERE flag_key = 'game.disabled.' || OLD.game_key;
    RETURN OLD;
  END IF;

  status_key := 'game.disabled.' || NEW.game_key;
  IF NEW.is_enabled THEN
    UPDATE public.feature_flags
    SET enabled = false, updated_at = now()
    WHERE flag_key = status_key;
  ELSE
    INSERT INTO public.feature_flags (flag_key, enabled, description, metadata)
    VALUES (status_key, true, 'System-managed game availability status', '{}'::jsonb)
    ON CONFLICT (flag_key) DO UPDATE
      SET enabled = true,
          description = EXCLUDED.description,
          metadata = EXCLUDED.metadata,
          updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_game_disabled_flag() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_sync_game_disabled_flag
  AFTER INSERT OR UPDATE OR DELETE ON public.game_configs
  FOR EACH ROW EXECUTE FUNCTION public.sync_game_disabled_flag();

INSERT INTO public.feature_flags (flag_key, enabled, description, metadata)
SELECT
  'game.disabled.' || game_key,
  true,
  'System-managed game availability status',
  '{}'::jsonb
FROM public.game_configs
WHERE NOT is_enabled
ON CONFLICT (flag_key) DO UPDATE
  SET enabled = true,
      description = EXCLUDED.description,
      metadata = EXCLUDED.metadata,
      updated_at = now();