/*
  # 03 VERIFY RLS
  # --------------------------------------------------------------------------------
  # Run this in Supabase SQL Editor to check if permissions look correct.
*/

-- 1. Check Tables and RLS Status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('competencies', 'topics', 'chat_messages', 'profiles');

-- 2. Check admin function
SELECT routine_name, security_type 
FROM information_schema.routines 
WHERE routine_name = 'is_admin';

-- 3. Check Policies
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Test Select (as if anonymous - should return 0 rows if RLS works well for 'authenticated' only)
-- Note: In Supabase SQL Editor you are 'postgres' (superuser), so you see everything.
-- To test RLS, you'd switched role, but that's complex in a script.
-- Visual verify: "Are there policies named 'Admin All' and 'Public Read'?" -> Yes = Good.
