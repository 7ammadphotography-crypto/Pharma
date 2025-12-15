/*
  # 10 FIX USER SYNC TRIGGER & BACKFILL
  # ===============================================================================
  # Purpose: 
  # 1. Create a trigger to automatically create a profile when a new user signs up.
  # 2. Backfill (monitor and restore) profiles for all existing users who are missing one.
  # ===============================================================================
*/

-- 1. Create the function that handles the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, created_date, account_status)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'student'), -- Default to student if no role
    new.created_at,
    new.created_at,
    'active'
  )
  ON CONFLICT (id) DO NOTHING; -- Safe if already exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. BACKFILL EXISTING USERS
-- This query finds all users in auth.users who do NOT have a profile and creates one for them.
INSERT INTO public.profiles (id, email, full_name, role, created_at, created_date, account_status)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  COALESCE(raw_user_meta_data->>'role', 'student'),
  created_at,
  created_at,
  'active'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 4. Verify count
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users_count, 
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  'Sync fixed and backfill complete' as status;
