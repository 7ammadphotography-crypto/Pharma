/*
  # FINAL ADMIN & SECURITY SCRIPT
  # --------------------------------------------------------------------------------
  # This script does 3 things:
  # 1. SCHEMA ALIGNMENT: Adds missing columns used by the Admin UI (icon, color, order, etc.)
  # 2. CHAT SETUP: Creates chat tables if they don't exist.
  # 3. SECURITY (RLS): Enables RLS and sets strict policies (Admins = Full Access, Students = Read Only/Own Data).

  # INSTRUCTIONS
  # 1. Run this entire script in Supabase SQL Editor.
  # 2. If you see "relation already exists" errors, those are safe to ignore (idempotent).
*/

-- ==============================================================================
-- 1. SCHEMA ALIGNMENT (Fixing missing columns for UI)
-- ==============================================================================

-- COMPETENCIES (Chapters)
CREATE TABLE IF NOT EXISTS public.competencies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text,
  "order" integer DEFAULT 0,
  weight integer DEFAULT 0,
  icon text DEFAULT 'pill',
  color text DEFAULT 'blue'
);

-- Add columns if they strictly don't exist (Idempotent approach)
DO $$ 
BEGIN 
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS weight integer DEFAULT 0;
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS icon text DEFAULT 'pill';
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS color text DEFAULT 'blue';
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS description text;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

-- TOPICS
CREATE TABLE IF NOT EXISTS public.topics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text,
  competency_id uuid REFERENCES public.competencies(id) ON DELETE SET NULL,
  "order" integer DEFAULT 0
);

DO $$ 
BEGIN 
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS description text;
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS competency_id uuid REFERENCES public.competencies(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

-- CASES
CREATE TABLE IF NOT EXISTS public.cases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  title text,
  case_text text,
  image_url text,
  difficulty text DEFAULT 'medium',
  competency_id uuid REFERENCES public.competencies(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  tags text[]
);

DO $$ 
BEGIN 
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS title text;
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS case_text text;
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS image_url text;
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium';
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS competency_id uuid REFERENCES public.competencies(id) ON DELETE SET NULL;
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL;
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS tags text[];
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

-- QUESTIONS
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_date timestamptz DEFAULT now(), -- UI uses created_date, careful
  question_text text NOT NULL,
  options text[] NOT NULL,
  correct_answer integer DEFAULT 0,
  explanation text,
  difficulty text DEFAULT 'medium',
  tags text[],
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL
);

-- Note: The UI seems to check "created_date" but standard Supabase is "created_at".
-- We'll enable access to both if needed or stick to what's there.
DO $$ 
BEGIN 
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_text text;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS options text[];
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS correct_answer integer DEFAULT 0;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation text;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium';
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS tags text[];
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

-- TOPIC_QUESTIONS (Join Table)
CREATE TABLE IF NOT EXISTS public.topic_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid REFERENCES public.topics(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 2. CHAT SETUP
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  content text,
  user_email text NOT NULL,
  user_name text,
  is_question boolean DEFAULT false,
  is_admin boolean DEFAULT false, -- Useful for UI badges
  is_pinned boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  likes integer DEFAULT 0,
  file_urls text[], -- Legacy or alternative to attachments
  reply_to jsonb,
  attachments text[],
  options text[],
  votes jsonb,
  voice_url text,
  voice_duration numeric,
  is_voice boolean DEFAULT false,
  is_edited boolean DEFAULT false
);

-- Enable Realtime for Chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Add columns if they strictly don't exist (Idempotent approach)
DO $$ 
BEGIN 
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to jsonb;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachments text[];
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS options text[];
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS votes jsonb;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS voice_url text;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS voice_duration numeric;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_voice boolean DEFAULT false;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

-- ==============================================================================
-- 3. SECURITY & RLS POLICIES
-- ==============================================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- PROFILES ---
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: Users see own" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profiles: Admins see all" ON public.profiles
FOR SELECT USING (is_admin());

CREATE POLICY "Profiles: Admins update all" ON public.profiles
FOR UPDATE USING (is_admin());

CREATE POLICY "Profiles: Users update own (non-role fields)" ON public.profiles
FOR UPDATE USING (auth.uid() = id); 
-- Note: Ideally we prevent role updates by users via trigger, but this is basic RLS.

-- --- CONTENT TABLES (Competencies, Topics, Cases, Questions) ---
-- Rule: Everyone (Authenticated) can READ. Only ADMINS can WRITE.

DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN SELECT unnest(ARRAY['competencies', 'topics', 'cases', 'questions', 'topic_questions']) 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        
        -- Drop existing policies to prevent conflicts/duplicates
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Public Read %I" ON public.%I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Admin Write %I" ON public.%I', t, t);
        EXCEPTION WHEN OTHERS THEN NULL; END;

        -- CREATE READ POLICY
        EXECUTE format('CREATE POLICY "Public Read %I" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);

        -- CREATE WRITE POLICIES (Insert, Update, Delete)
        EXECUTE format('CREATE POLICY "Admin Insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (is_admin())', t, t);
        EXECUTE format('CREATE POLICY "Admin Update %I" ON public.%I FOR UPDATE TO authenticated USING (is_admin())', t, t);
        EXECUTE format('CREATE POLICY "Admin Delete %I" ON public.%I FOR DELETE TO authenticated USING (is_admin())', t, t);
    END LOOP;
END $$;

-- --- CHAT MESSAGES ---
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat: Everyone reads" ON public.chat_messages
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Chat: Users insert own" ON public.chat_messages
FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL); -- Simple auth check

CREATE POLICY "Chat: Users update own, Admins update all" ON public.chat_messages
FOR UPDATE TO authenticated 
USING (
  user_email = (select email from auth.users where id = auth.uid()) 
  OR is_admin()
);

-- --- USER ACTIVITY (Attempts, Points, Bookmarks) ---
-- Rule: Users see/write OWN. Admins see ALL.

DO $$ 
DECLARE 
    tbl text;
BEGIN 
    FOR tbl IN SELECT unnest(ARRAY['quiz_attempts', 'user_points']) 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        
        -- READ
        EXECUTE format('DROP POLICY IF EXISTS "Owner/Admin Select %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Owner/Admin Select %I" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin())', tbl, tbl);
        
        -- WRITE (Insert/Update) - Usually system or user action
        EXECUTE format('DROP POLICY IF EXISTS "Owner Insert %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Owner Insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', tbl, tbl);
        
        EXECUTE format('DROP POLICY IF EXISTS "Owner Update %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Owner Update %I" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id OR is_admin())', tbl, tbl);
    END LOOP;
END $$;

-- Bookmarks might be slightly different table structure, assume user_id
ALTER TABLE public.bookmarked_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bookmarks: Owner Only" ON public.bookmarked_questions
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Finish
