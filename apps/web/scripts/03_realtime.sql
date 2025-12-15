/*
  # 03 REALTIME SETUP
  # ===============================================================================
  # Purpose: Enable Supabase Realtime for chat_messages table
  # ===============================================================================
*/

-- ============================================================================
-- A. ENSURE CHAT TABLE EXISTS AND HAS CORRECT STRUCTURE
-- ============================================================================

-- Already handled in 01_align_schema.sql, but verify:
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
        CREATE TABLE public.chat_messages (
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
    END IF;
END $$;

-- ============================================================================
-- B. ADD TO REALTIME PUBLICATION
-- ============================================================================

DO $$
BEGIN
    -- Add chat_messages to the realtime publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'chat_messages already in publication';
    WHEN OTHERS THEN 
        RAISE NOTICE 'realtime setup: %', SQLERRM;
END $$;

-- ============================================================================
-- C. ENABLE REPLICA IDENTITY (Required for realtime updates/deletes)
-- ============================================================================

ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- ============================================================================
-- COMPLETE
-- ============================================================================
SELECT 'Realtime setup complete' AS status;
