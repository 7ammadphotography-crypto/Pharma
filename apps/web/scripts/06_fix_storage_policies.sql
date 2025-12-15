/*
  # 06 FIX STORAGE POLICIES
  # ===============================================================================
  # Purpose: Ensure 'authenticated' role has usage rights on storage schema
  # ===============================================================================
*/

-- Grant schema usage (sometimes required if default privs are revoked)
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;

-- Ensure bucket is public
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- Re-apply simplified upload policy
DROP POLICY IF EXISTS "Avatars: Auth Upload" ON storage.objects;

CREATE POLICY "Avatars: Auth Upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- Ensure select policy exists
DROP POLICY IF EXISTS "Avatars: Public Read" ON storage.objects;
CREATE POLICY "Avatars: Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

SELECT 'Storage policies reinforced' AS status;
