
-- Ensure handle_new_user trigger is attached so future signups auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow users to create their own profile row (for older accounts without one)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Backfill missing profiles for existing auth users
INSERT INTO public.profiles (id, username, display_name, email, referral_code)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', u.email, u.id::text),
  COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'username', u.email, u.id::text),
  u.email,
  gen_random_uuid()::text
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
