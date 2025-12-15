/*
  # 07 FIX PROFILES
  # ===============================================================================
  # Purpose: 
  # 1. Add missing columns expected by AdminUsers.jsx
  # 2. Force re-apply RLS policies for Profiles to ensure visibility
  # ===============================================================================
*/

-- 1. Add missing columns safely
DO $$
BEGIN
    -- subscription_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_status text DEFAULT 'none';
    END IF;

    -- account_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'account_status') THEN
        ALTER TABLE public.profiles ADD COLUMN account_status text DEFAULT 'active';
    END IF;

    -- created_date (alias for created_at if needed, or new column)
    -- AdminUsers.jsx uses created_date. Let's make it a generated column or just default to created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_date') THEN
        ALTER TABLE public.profiles ADD COLUMN created_date timestamptz DEFAULT now();
        -- Backfill existing rows
        UPDATE public.profiles SET created_date = created_at WHERE created_date IS NULL;
    END IF;
END $$;

-- 2. RESET RLS POLICIES FOR PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles: Read All" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Insert Own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Update Own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Admin Manage" ON public.profiles;

-- ALLOW EVERYONE Authenticated to read ALL profiles
CREATE POLICY "Profiles: Read All" ON public.profiles 
FOR SELECT TO authenticated USING (true);

-- Allow admins to update anyone
CREATE POLICY "Profiles: Admin Update" ON public.profiles 
FOR UPDATE TO authenticated 
USING (is_admin()) 
WITH CHECK (is_admin());

-- Allow admins to insert/delete? (Usually profiles are managed by Auth triggers, but allow admins edit)

SELECT 'Profiles schema and RLS fixed' AS status;
