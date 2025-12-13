/*
  # 02 RLS POLICIES
  # ===============================================================================
  # Purpose: Secure the database with proper Row Level Security
  # - Admins: Full CRUD on content tables
  # - Users: Read content, manage own data
  # ===============================================================================
*/

-- ============================================================================
-- A. UTILITY FUNCTION: is_admin()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- B. CONTENT TABLES: Admin Full Access, Users Read-Only
-- Tables: competencies, topics, cases, questions, topic_questions
-- ============================================================================

-- Helper: Apply standard content policies to a table
DO $$ 
DECLARE 
    tbl text;
BEGIN 
    FOR tbl IN SELECT unnest(ARRAY['competencies', 'topics', 'cases', 'questions', 'topic_questions']) 
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        
        -- Drop existing policies (clean slate)
        EXECUTE format('DROP POLICY IF EXISTS "Content: Public Read" ON public.%I', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Content: Admin Insert" ON public.%I', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Content: Admin Update" ON public.%I', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Content: Admin Delete" ON public.%I', tbl);
        
        -- Create policies
        -- SELECT: Any authenticated user can read
        EXECUTE format('CREATE POLICY "Content: Public Read" ON public.%I FOR SELECT TO authenticated USING (true)', tbl);
        -- INSERT: Only admins
        EXECUTE format('CREATE POLICY "Content: Admin Insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (is_admin())', tbl);
        -- UPDATE: Only admins
        EXECUTE format('CREATE POLICY "Content: Admin Update" ON public.%I FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin())', tbl);
        -- DELETE: Only admins
        EXECUTE format('CREATE POLICY "Content: Admin Delete" ON public.%I FOR DELETE TO authenticated USING (is_admin())', tbl);
    END LOOP;
END $$;

-- ============================================================================
-- C. PROFILES TABLE
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles: Read All" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Insert Own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Update Own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Admin Manage" ON public.profiles;

-- SELECT: Any authenticated can read all profiles (for leaderboards, chat, etc)
CREATE POLICY "Profiles: Read All" ON public.profiles 
FOR SELECT TO authenticated USING (true);

-- INSERT: Users can create their own profile
CREATE POLICY "Profiles: Insert Own" ON public.profiles 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update own profile OR admin can update any
CREATE POLICY "Profiles: Update Own" ON public.profiles 
FOR UPDATE TO authenticated 
USING (auth.uid() = id OR is_admin()) 
WITH CHECK (auth.uid() = id OR is_admin());

-- ============================================================================
-- D. CHAT MESSAGES TABLE
-- ============================================================================

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat: Read All" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat: Insert Auth" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat: Update Own" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat: Delete Own" ON public.chat_messages;

-- SELECT: Any authenticated can read all messages
CREATE POLICY "Chat: Read All" ON public.chat_messages 
FOR SELECT TO authenticated USING (true);

-- INSERT: Any authenticated user can send messages
CREATE POLICY "Chat: Insert Auth" ON public.chat_messages 
FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE: Owner or admin can update
CREATE POLICY "Chat: Update Own" ON public.chat_messages 
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id OR is_admin());

-- DELETE: Owner or admin can delete
CREATE POLICY "Chat: Delete Own" ON public.chat_messages 
FOR DELETE TO authenticated 
USING (auth.uid() = user_id OR is_admin());

-- ============================================================================
-- E. USER ACTIVITY TABLES (quiz_attempts, user_points, bookmarked_questions)
-- ============================================================================

-- QUIZ ATTEMPTS
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Attempts: Read Own" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Attempts: Insert Own" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Attempts: Admin Read All" ON public.quiz_attempts;

CREATE POLICY "Attempts: Read Own" ON public.quiz_attempts 
FOR SELECT TO authenticated 
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Attempts: Insert Own" ON public.quiz_attempts 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- USER POINTS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Points: Read All" ON public.user_points;
DROP POLICY IF EXISTS "Points: Manage Own" ON public.user_points;

CREATE POLICY "Points: Read All" ON public.user_points 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Points: Manage Own" ON public.user_points 
FOR ALL TO authenticated 
USING (user_id = auth.uid() OR is_admin());

-- BOOKMARKED QUESTIONS
ALTER TABLE public.bookmarked_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bookmarks: Manage Own" ON public.bookmarked_questions;

CREATE POLICY "Bookmarks: Manage Own" ON public.bookmarked_questions 
FOR ALL TO authenticated 
USING (user_id = auth.uid());

-- ============================================================================
-- COMPLETE
-- ============================================================================
SELECT 'RLS policies applied' AS status;
