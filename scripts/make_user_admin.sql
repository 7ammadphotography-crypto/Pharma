/*
  # PROMOTE USER TO ADMIN
  # --------------------------------------------------------------------------------
  # Replace 'YOUR_EMAIL_HERE' with the email address you use to log in.
  # Run this script in the Supabase SQL Editor.
*/

DO $$
DECLARE
  target_email text := 'info@tutssolution.com'; -- CHANGE THIS to your email if different
  target_user_id uuid;
BEGIN
  -- 1. Find the User ID from auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NOT NULL THEN
    -- 2. Update the profile role
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = target_user_id;

    IF FOUND THEN
      RAISE NOTICE '✅ User % has been promoted to ADMIN.', target_email;
    ELSE
      -- Fallback: If profile doesn't exist, try to create it (unlikely if logged in)
      INSERT INTO public.profiles (id, email, role, full_name)
      VALUES (target_user_id, target_email, 'admin', 'Admin User')
      ON CONFLICT (id) DO UPDATE SET role = 'admin';
      
      RAISE NOTICE '✅ User % profile created/updated as ADMIN.', target_email;
    END IF;

  ELSE
    RAISE NOTICE '❌ User with email % not found in auth.users. Please sign up first.', target_email;
  END IF;
END $$;
