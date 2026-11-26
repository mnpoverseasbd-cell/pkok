-- Configure mnpoverseasbd@gmail.com as the main admin account (email & password: mnpoverseasbd@gmail.com)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_uid uuid;
  v_email constant text := 'mnpoverseasbd@gmail.com';
  v_username text := 'mnpoverseasbd';
  v_hash text;
BEGIN
  SET LOCAL search_path = public, extensions, auth;
  v_hash := crypt(v_email, gen_salt('bf'));

  SELECT id INTO v_uid
  FROM auth.users
  WHERE lower(email) = v_email
  LIMIT 1;

  IF v_uid IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
      v_username := 'mnpoverseasbd_admin';
    END IF;

    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_uid,
      'authenticated',
      'authenticated',
      v_email,
      v_hash,
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', v_username, 'display_name', 'Main Admin'),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_uid,
      v_uid::text,
      jsonb_build_object(
        'sub', v_uid::text,
        'email', v_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    ) ON CONFLICT DO NOTHING;
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = v_hash,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      banned_until = NULL,
      updated_at = now()
    WHERE id = v_uid;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, email, referral_code)
  VALUES (v_uid, v_username, 'Main Admin', v_email, public.generate_referral_code())
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, 'Main Admin');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
