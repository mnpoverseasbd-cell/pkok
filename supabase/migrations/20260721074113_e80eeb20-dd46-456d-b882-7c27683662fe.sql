
-- 1. Remove public/anon read on sensitive tables
DROP POLICY IF EXISTS "Public can lookup by referral code" ON public.profiles;

DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;
CREATE POLICY "Authenticated can read feature flags" ON public.feature_flags
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view game configs" ON public.game_configs;
CREATE POLICY "Authenticated can view game configs" ON public.game_configs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "public read tournaments" ON public.tournaments;
CREATE POLICY "authenticated read tournaments" ON public.tournaments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "public read entries" ON public.tournament_entries;
CREATE POLICY "authenticated read entries" ON public.tournament_entries
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view tier configs" ON public.vip_tier_configs;
CREATE POLICY "Authenticated can view tier configs" ON public.vip_tier_configs
  FOR SELECT TO authenticated USING (true);

-- 2. Revoke EXECUTE from anon on SECURITY DEFINER functions.
-- Trigger functions: revoke from PUBLIC/anon/authenticated (only run via trigger).
REVOKE EXECUTE ON FUNCTION public.apply_deposit_bonus() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_transaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_vip_upgrade() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pay_referral_commission() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.track_tournament_wager() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.track_wagering() FROM PUBLIC, anon, authenticated;

-- User-callable functions: revoke from PUBLIC/anon; keep authenticated.
REVOKE EXECUTE ON FUNCTION public.claim_promo_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.finalize_tournament(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_tournament_leaderboard(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_unread_notification_count() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_wager_leaderboard(text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_tournament(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_my_notifications(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC, anon;
