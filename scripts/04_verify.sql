/*
  # 04 VERIFY
  # ===============================================================================
  # Purpose: Verification queries to confirm everything is set up correctly
  # Run these after applying 01, 02, 03 scripts
  # ===============================================================================
*/

-- ============================================================================
-- 1. CHECK TABLE EXISTENCE
-- ============================================================================
SELECT 'Tables Check' AS check_type;
SELECT tablename, 
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('competencies', 'topics', 'cases', 'questions', 'topic_questions', 'profiles', 'chat_messages', 'quiz_attempts', 'user_points', 'bookmarked_questions')
ORDER BY tablename;

-- ============================================================================
-- 2. CHECK is_admin() FUNCTION EXISTS
-- ============================================================================
SELECT 'Function Check' AS check_type;
SELECT routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'is_admin';

-- ============================================================================
-- 3. LIST ALL POLICIES
-- ============================================================================
SELECT 'Policies Check' AS check_type;
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. CHECK UNIQUE CONSTRAINTS (for upsert)
-- ============================================================================
SELECT 'Constraints Check' AS check_type;
SELECT tc.table_name, tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY tc.table_name;

-- ============================================================================
-- 5. CHECK REALTIME PUBLICATION
-- ============================================================================
SELECT 'Realtime Check' AS check_type;
SELECT pubname, schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- ============================================================================
-- 6. SAMPLE DATA COUNTS
-- ============================================================================
SELECT 'Data Counts' AS check_type;
SELECT 'competencies' as table_name, COUNT(*) as row_count FROM public.competencies
UNION ALL SELECT 'topics', COUNT(*) FROM public.topics
UNION ALL SELECT 'cases', COUNT(*) FROM public.cases
UNION ALL SELECT 'questions', COUNT(*) FROM public.questions
UNION ALL SELECT 'topic_questions', COUNT(*) FROM public.topic_questions
UNION ALL SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL SELECT 'chat_messages', COUNT(*) FROM public.chat_messages;

-- ============================================================================
-- 7. CHECK FOR DUPLICATES (would block UNIQUE constraints)
-- ============================================================================
SELECT 'Duplicate Check' AS check_type;

SELECT 'competencies' as table_name, title, COUNT(*) as duplicates
FROM public.competencies
GROUP BY title HAVING COUNT(*) > 1

UNION ALL

SELECT 'topics', title, COUNT(*)
FROM public.topics
GROUP BY title HAVING COUNT(*) > 1

UNION ALL

SELECT 'cases', title, COUNT(*)
FROM public.cases
GROUP BY title HAVING COUNT(*) > 1;

-- ============================================================================
-- VERIFICATION COMPLETE
-- Expected results:
-- 1. All tables exist with RLS ENABLED
-- 2. is_admin() function exists with SECURITY DEFINER
-- 3. Policies for each table (Content: Public Read, Content: Admin Insert, etc)
-- 4. UNIQUE constraints on title columns
-- 5. chat_messages in supabase_realtime publication
-- 6. Data counts (0 is OK for new setup)
-- 7. No duplicates (empty result is good)
-- ============================================================================
