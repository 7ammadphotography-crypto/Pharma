# Migration Suite Runbook

## Overview
This runbook guides you through applying the database migration scripts to fix all Admin Panel and Chat issues.

---

## Prerequisites
- Access to Supabase Dashboard (SQL Editor)
- `.env.local` configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- For seed script: `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

---

## Step 1: Apply Schema Alignment

**File:** `scripts/01_align_schema.sql`

1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `scripts/01_align_schema.sql`
3. Paste and click **Run**
4. Expected result: `Schema alignment complete`

**What it does:**
- Adds missing columns to all tables
- Creates missing tables (topic_questions, chat_messages, etc)
- Adds indexes for performance
- Adds UNIQUE constraints for upsert operations

---

## Step 2: Apply RLS Policies

**File:** `scripts/02_rls_policies.sql`

1. Copy entire contents of `scripts/02_rls_policies.sql`
2. Paste in SQL Editor and click **Run**
3. Expected result: `RLS policies applied`

**What it does:**
- Creates `is_admin()` helper function
- Enables RLS on all tables
- Sets up policies:
  - Content tables: Admins can write, everyone can read
  - Profiles: Users manage their own
  - Chat: Anyone authenticated can send

---

## Step 3: Enable Realtime

**File:** `scripts/03_realtime.sql`

1. Copy entire contents of `scripts/03_realtime.sql`
2. Paste in SQL Editor and click **Run**
3. Expected result: `Realtime setup complete`

**What it does:**
- Adds `chat_messages` to realtime publication
- Enables replica identity for update/delete events

---

## Step 4: Verify Setup

**File:** `scripts/04_verify.sql`

1. Copy entire contents of `scripts/04_verify.sql`
2. Paste in SQL Editor and click **Run**
3. Review the results:
   - All tables should show RLS: ENABLED
   - `is_admin` function should exist
   - Policies should be listed for each table
   - `chat_messages` should be in realtime publication

---

## Step 5: Create Storage Bucket (For File Uploads)

1. Go to Supabase Dashboard → **Storage**
2. Click **New Bucket**
3. Name: `chat-uploads`
4. Check ✅ **Public bucket**
5. Click **Create**

Then add storage policies:
```sql
-- Run in SQL Editor
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-uploads', 'chat-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;
```

---

## Step 6: Run Seed Script (Optional)

```bash
npm run seed
```

Expected output:
- ✅ Created X Competencies
- ✅ Created X Topics
- ✅ Created X Cases
- ✅ Created X Questions
- 🎉 Seed Complete!

---

## Step 7: Test the Application

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Test Admin Panel:**
   - Go to `/ManageChapters` → Add a chapter
   - Go to `/ManageTopics` → Select chapter, add topic
   - Go to `/ManageQuestions` → Add a question
   - Go to `/AdminUsers` → View users list

3. **Test Chat:**
   - Go to `/GroupChat`
   - Send a message
   - Verify it appears immediately (realtime)

---

## Troubleshooting

### "Duplicate Key" Error During Seed
Run this dedupe query first:
```sql
-- Remove duplicate competencies (keep newest)
DELETE FROM public.competencies a 
USING public.competencies b 
WHERE a.id < b.id AND a.title = b.title;

-- Remove duplicate topics
DELETE FROM public.topics a 
USING public.topics b 
WHERE a.id < b.id AND a.title = b.title;

-- Remove duplicate cases
DELETE FROM public.cases a 
USING public.cases b 
WHERE a.id < b.id AND a.title = b.title;
```

### "Permission Denied" Errors
1. Confirm your user has `role = 'admin'` in profiles:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

2. Re-run `scripts/02_rls_policies.sql`

### Chat Not Working
1. Confirm realtime is enabled:
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```
Should show `chat_messages` in the list.

2. Check browser console for WebSocket errors

---

## What Changed Summary

| Component | Change |
|-----------|--------|
| Schema | Added missing columns (tags, metadata, voice_url, etc) |
| RLS | New `is_admin()` function + proper policies |
| Realtime | `chat_messages` added to publication |
| Code | `GroupChat.jsx` fixed to use correct API method |
| Indexes | Added for foreign keys (performance) |
