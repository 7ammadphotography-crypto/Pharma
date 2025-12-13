/*
  # 05 STORAGE SETUP: AVATARS
  # ===============================================================================
  # Purpose: Create 'avatars' storage bucket and set restricted permissions
  # ===============================================================================
*/

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Avatars: Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: Owner Delete" ON storage.objects;

-- 3. Create Policies

-- READ: Everyone can see avatars (public profile usage)
CREATE POLICY "Avatars: Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- UPLOAD: Authenticated users can upload
CREATE POLICY "Avatars: Auth Upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- UPDATE: Users can update their own files
CREATE POLICY "Avatars: Owner Update"
ON storage.objects FOR UPDATE TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- DELETE: Users can delete their own files
CREATE POLICY "Avatars: Owner Delete"
ON storage.objects FOR DELETE TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

SELECT 'Avatars storage setup complete' AS status;
