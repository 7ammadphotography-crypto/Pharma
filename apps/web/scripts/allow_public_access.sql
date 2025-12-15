/*
  # ALLOW PUBLIC ACCESS (DEV MODE FIX)
  # --------------------------------------------------------------------------------
  # This script allows ANONYMOUS (unlogged-in) users to add data.
  # This makes the "Dev User" fallback in your app actually work with the database.
  #
  # WARNING: For development only. In production, you generally want users to log in.
*/

-- 1. CHAT: Allow 'anon' role to Insert/Update
DROP POLICY IF EXISTS "Chat: Public Insert" ON public.chat_messages;
CREATE POLICY "Chat: Public Insert" ON public.chat_messages
FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Chat: Public Update" ON public.chat_messages;
CREATE POLICY "Chat: Public Update" ON public.chat_messages
FOR UPDATE TO anon, authenticated
USING (true);

-- 2. TOPICS/CHAPTERS: Allow 'anon' role to Insert/Update
DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN SELECT unnest(ARRAY['competencies', 'topics', 'cases', 'questions', 'topic_questions']) 
    LOOP
        -- Insert
        EXECUTE format('DROP POLICY IF EXISTS "Public Insert %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Public Insert %I" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)', t, t);
        
        -- Update
        EXECUTE format('DROP POLICY IF EXISTS "Public Update %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Public Update %I" ON public.%I FOR UPDATE TO anon, authenticated USING (true)', t, t);
    END LOOP;
END $$;
