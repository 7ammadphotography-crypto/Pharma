/*
  # FIX MISSING COLUMNS
  # --------------------------------------------------------------------------------
  # Adds columns expected by the UI that are missing in the database.
*/

-- 1. TOPICS: Add 'metadata' and 'tags'
DO $$ 
BEGIN 
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
    -- Ensure other UI columns exist too
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS icon text DEFAULT 'pill';
    ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS name text; -- Legacy mirror of title
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

-- 2. CHAT: Add 'file_urls' (Legacy support)
DO $$ 
BEGIN 
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_urls text[] DEFAULT '{}';
    -- Ensure user_id is compatible
    -- ALTER TABLE public.chat_messages ALTER COLUMN user_id TYPE uuid USING user_id::uuid; 
    -- (Skipping type change to avoid errors if incompatible text exists, assume it's uuid or handled)
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;
