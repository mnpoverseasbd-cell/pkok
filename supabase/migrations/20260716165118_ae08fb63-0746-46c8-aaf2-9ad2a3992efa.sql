
REVOKE EXECUTE ON FUNCTION public.recompute_vip_tier(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_txn_recompute_tier() FROM PUBLIC, anon, authenticated;
