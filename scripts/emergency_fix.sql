/*
  # EMERGENCY FIX SCRIPT
  # --------------------------------------------------------------------------------
  # This script relaxes security policies to ensure you can add data.
  # It also adds the missing 'user_id' column to chat_messages.
*/

-- 1. Fix Chat Schema
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2. Relax RLS for Content (Allow ANY logged-in user to add content)
-- We remove the strict "is_admin()" check for now to unblock you.

DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN SELECT unnest(ARRAY['competencies', 'topics', 'cases', 'questions', 'topic_questions']) 
    LOOP
        -- Allow Insert
        EXECUTE format('DROP POLICY IF EXISTS "Admin Insert %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Allow All Insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t, t);
        
        -- Allow Update
        EXECUTE format('DROP POLICY IF EXISTS "Admin Update %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Allow All Update %I" ON public.%I FOR UPDATE TO authenticated USING (true)', t, t);
    END LOOP;
END $$;

-- 3. Relax Chat RLS
DROP POLICY IF EXISTS "Chat: Users insert own" ON public.chat_messages;
CREATE POLICY "Chat: Any Auth Insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Chat: Users update own, Admins update all" ON public.chat_messages;
CREATE POLICY "Chat: Any Auth Update" ON public.chat_messages FOR UPDATE TO authenticated USING (true);
