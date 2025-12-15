-- Add UNIQUE constraints to support ON CONFLICT (title) upserts

DO $$ 
BEGIN 
    -- Competencies
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'competencies_title_key'
    ) THEN
        ALTER TABLE public.competencies ADD CONSTRAINT competencies_title_key UNIQUE (title);
    END IF;

    -- Topics
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'topics_title_key'
    ) THEN
        ALTER TABLE public.topics ADD CONSTRAINT topics_title_key UNIQUE (title);
    END IF;

    -- Cases (We upsert by title in seed.js)
    -- Note: Real world might allow duplicate case titles, but for seed we need this or ID.
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'cases_title_key'
    ) THEN
        ALTER TABLE public.cases ADD CONSTRAINT cases_title_key UNIQUE (title);
    END IF;

END $$;
