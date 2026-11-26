SELECT cron.alter_job(
  1,
  schedule := '0 0 * * *',
  command := 'SELECT public.run_daily_bonuses(); SELECT public.run_weekly_bonuses(); SELECT public.run_daily_cashback();'
);