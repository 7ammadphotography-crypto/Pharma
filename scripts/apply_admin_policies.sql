-- RLS Policies for Admin Access
-- Run this in Supabase SQL Editor

-- 1. Profiles: Admin can read/update all
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin' 
  OR auth.uid() = id
);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE
TO authenticated 
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin' 
  OR auth.uid() = id
);

-- 2. User Points / Quiz Attempts: Admin can view all
CREATE POLICY "Admins can view all quiz attempts"
ON public.quiz_attempts FOR SELECT
TO authenticated
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin' 
  OR auth.uid() = user_id -- Assume user_id links to profile
);

-- 3. Content (Topics, Questions, Cases): Admin can insert/update/delete
-- Assuming 'questions' table
CREATE POLICY "Admins can insert questions"
ON public.questions FOR INSERT
TO authenticated
WITH CHECK (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update questions"
ON public.questions FOR UPDATE
TO authenticated
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete questions"
ON public.questions FOR DELETE
TO authenticated
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Repeat similar logic for 'topics', 'competencies', 'cases' if strictly restricted.
-- Currently, anyone authenticated might read them (which is fine for students).
