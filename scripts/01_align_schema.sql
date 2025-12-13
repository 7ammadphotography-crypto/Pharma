/*
  # 01 ALIGN SCHEMA
  # ===============================================================================
  # Purpose: Align DB schema with codebase expectations
  # Safe: All operations are idempotent (IF NOT EXISTS, DO/EXCEPTION blocks)
  # ===============================================================================
*/

-- ============================================================================
-- A. COMPETENCIES (Chapters)
-- ============================================================================
-- Expected columns: id, title, name, description, icon, color, weight, order, created_at

DO $$ BEGIN 
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS title text;
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS name text;
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS description text;
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS icon text DEFAULT 'pill';
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS color text DEFAULT 'blue';
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS weight integer DEFAULT 0;
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;
    ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'competencies columns: %', SQLERRM; END $$;

-- Sync name/title columns (whichever is populated)
UPDATE public.competencies SET name = title WHERE name IS NULL AND title IS NOT NULL;
UPDATE public.competencies SET title = name WHERE title IS NULL AND name IS NOT NULL;

-- ============================================================================
-- B. TOPICS
-- ============================================================================
-- Expected columns: id, title, name, description, competency_id, order, icon, tags, metadata, created_at

DO $$ BEGIN 
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS title text;
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS name text;
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS description text;
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS competency_id uuid REFERENCES public.competencies(id) ON DELETE SET NULL;
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS icon text DEFAULT 'pill';
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'topics columns: %', SQLERRM; END $$;

-- Sync name/title columns
UPDATE public.topics SET name = title WHERE name IS NULL AND title IS NOT NULL;
UPDATE public.topics SET title = name WHERE title IS NULL AND name IS NOT NULL;

-- ============================================================================
-- C. CASES
-- ============================================================================
-- Expected columns: id, title, case_text, case_type, difficulty, image_url, competency_id, topic_id, tags, created_at/created_date

DO $$ BEGIN 
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS title text;
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS case_text text;
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS case_type text DEFAULT 'clinical';
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium';
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS image_url text;
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS competency_id uuid REFERENCES public.competencies(id) ON DELETE SET NULL;
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL;
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
    ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS created_date timestamptz DEFAULT now();
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'cases columns: %', SQLERRM; END $$;

-- Sync created_at/created_date
UPDATE public.cases SET created_date = created_at WHERE created_date IS NULL AND created_at IS NOT NULL;
UPDATE public.cases SET created_at = created_date WHERE created_at IS NULL AND created_date IS NOT NULL;

-- ============================================================================
-- D. QUESTIONS
-- ============================================================================
-- Expected columns: id, question_text, options, correct_answer, explanation, difficulty, tags, case_id, created_at/created_date

DO $$ BEGIN 
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_text text;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS options text[] DEFAULT '{}';
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS correct_answer integer DEFAULT 0;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation text;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium';
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS created_date timestamptz DEFAULT now();
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'questions columns: %', SQLERRM; END $$;

-- Sync created_at/created_date
UPDATE public.questions SET created_date = created_at WHERE created_date IS NULL AND created_at IS NOT NULL;
UPDATE public.questions SET created_at = created_date WHERE created_at IS NULL AND created_date IS NOT NULL;

-- ============================================================================
-- E. TOPIC_QUESTIONS (Join Table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.topic_questions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id uuid REFERENCES public.topics(id) ON DELETE CASCADE,
    question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- F. PROFILES (Users)
-- ============================================================================
-- Expected columns: id, email, full_name, role, avatar_url, subscription_status, account_status, created_at/created_date

DO $$ BEGIN 
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'student';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_date timestamptz DEFAULT now();
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'profiles columns: %', SQLERRM; END $$;

-- Sync created_at/created_date
UPDATE public.profiles SET created_date = created_at WHERE created_date IS NULL AND created_at IS NOT NULL;

-- ============================================================================
-- G. CHAT_MESSAGES
-- ============================================================================
-- Expected columns: id, content, user_id, user_email, user_name, is_question, is_admin, is_pinned, is_deleted,
--                   likes, attachments, file_urls, reply_to, options, votes, voice_url, voice_duration, is_voice, is_edited, created_at

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    content text,
    user_id uuid,
    user_email text,
    user_name text,
    is_question boolean DEFAULT false,
    is_admin boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    likes integer DEFAULT 0,
    attachments text[] DEFAULT '{}',
    file_urls text[] DEFAULT '{}',
    reply_to jsonb,
    options text[] DEFAULT '{}',
    votes jsonb DEFAULT '{}',
    voice_url text,
    voice_duration numeric,
    is_voice boolean DEFAULT false,
    is_edited boolean DEFAULT false
);

-- Add any missing columns if table already exists
DO $$ BEGIN 
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS user_id uuid;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}';
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_urls text[] DEFAULT '{}';
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to jsonb;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS voice_url text;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS voice_duration numeric;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_voice boolean DEFAULT false;
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'chat_messages columns: %', SQLERRM; END $$;

-- ============================================================================
-- H. USER ACTIVITY TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    created_date timestamptz DEFAULT now(),
    user_id uuid, -- Primary owner
    created_by text, -- Legacy/Audit
    topic_id uuid,
    competency_id uuid,
    score integer DEFAULT 0,
    total integer DEFAULT 0,
    percentage numeric DEFAULT 0,
    is_completed boolean DEFAULT false,
    answers jsonb DEFAULT '[]'
);

-- Ensure columns exist if table already existed
DO $$ BEGIN 
    ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS user_id uuid;
    ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS created_by text;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'quiz_attempts columns: %', SQLERRM; END $$;

CREATE TABLE IF NOT EXISTS public.user_points (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    user_id uuid, -- Primary owner
    created_by text,
    total_points integer DEFAULT 0,
    level integer DEFAULT 1
);

DO $$ BEGIN 
    ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS user_id uuid;
    ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS created_by text;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'user_points columns: %', SQLERRM; END $$;

CREATE TABLE IF NOT EXISTS public.bookmarked_questions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    user_id uuid, -- Primary owner
    created_by text,
    question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE
);

DO $$ BEGIN 
    ALTER TABLE public.bookmarked_questions ADD COLUMN IF NOT EXISTS user_id uuid;
    ALTER TABLE public.bookmarked_questions ADD COLUMN IF NOT EXISTS created_by text;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'bookmarked_questions columns: %', SQLERRM; END $$;

-- ============================================================================
-- I. INDEXES (Performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_topics_competency ON public.topics(competency_id);
CREATE INDEX IF NOT EXISTS idx_cases_topic ON public.cases(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_case ON public.questions(case_id);
CREATE INDEX IF NOT EXISTS idx_topic_questions_topic ON public.topic_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_questions_question ON public.topic_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================================
-- J. UNIQUE CONSTRAINTS (for upsert onConflict)
-- Note: If duplicates exist, these will fail. See RUNBOOK for dedupe queries.
-- ============================================================================

-- Safely add unique constraint only if no duplicates exist
DO $$ 
BEGIN
    -- Check for competencies duplicates
    IF NOT EXISTS (SELECT title FROM public.competencies GROUP BY title HAVING COUNT(*) > 1) THEN
        ALTER TABLE public.competencies ADD CONSTRAINT competencies_title_key UNIQUE (title);
    END IF;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'competencies unique: %', SQLERRM; END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT title FROM public.topics GROUP BY title HAVING COUNT(*) > 1) THEN
        ALTER TABLE public.topics ADD CONSTRAINT topics_title_key UNIQUE (title);
    END IF;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'topics unique: %', SQLERRM; END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT title FROM public.cases GROUP BY title HAVING COUNT(*) > 1) THEN
        ALTER TABLE public.cases ADD CONSTRAINT cases_title_key UNIQUE (title);
    END IF;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'cases unique: %', SQLERRM; END $$;

-- Composite unique for topic_questions (no duplicate links)
DO $$ 
BEGIN
    ALTER TABLE public.topic_questions ADD CONSTRAINT topic_questions_unique UNIQUE (topic_id, question_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN RAISE NOTICE 'topic_questions unique: %', SQLERRM; END $$;

-- ============================================================================
-- COMPLETE
-- ============================================================================
SELECT 'Schema alignment complete' AS status;
