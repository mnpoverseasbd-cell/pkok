
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON public.profiles(referral_code);

-- Allow authenticated users to look up a profile by referral code (needed at register time)
DROP POLICY IF EXISTS "Public can lookup by referral code" ON public.profiles;
CREATE POLICY "Public can lookup by referral code"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);
