/*
  # STORAGE BUCKET SETUP
  # --------------------------------------------------------------------------------
  # Run these commands in Supabase Dashboard -> Storage -> Policies
  # OR run directly if you have storage admin access.
*/

-- 1. Create the bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-uploads', 
  'chat-uploads', 
  true,  -- Public bucket
  52428800,  -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'audio/webm', 'audio/mp3', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow authenticated users to upload anything
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-uploads');

-- 3. Allow public to view/download
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'chat-uploads');

-- 4. Allow users to update/delete their own uploads
CREATE POLICY "Allow owner actions" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'chat-uploads' AND auth.uid()::text = owner::text)
WITH CHECK (bucket_id = 'chat-uploads');
