-- ENSTAROBOTS - EXTENDED DATABASE FIX (ANNOUNCEMENTS & MATCHES)
-- This script extends the UUID->TEXT conversion to announcements and matches tables.

-- 1. FIX ANNOUNCEMENTS
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Drop FK constraint if it exists
    SELECT conname INTO constraint_name FROM pg_constraint 
    WHERE conrelid = 'announcements'::regclass AND confrelid = 'competitions'::regclass;
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE announcements DROP CONSTRAINT ' || constraint_name;
    END IF;

    -- Convert Type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='competition_id') THEN
        ALTER TABLE announcements ALTER COLUMN competition_id TYPE TEXT;
    END IF;
END $$;

-- 2. FIX MATCHES
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Drop FK constraint if it exists
    SELECT conname INTO constraint_name FROM pg_constraint 
    WHERE conrelid = 'matches'::regclass AND confrelid = 'competitions'::regclass;
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE matches DROP CONSTRAINT ' || constraint_name;
    END IF;

    -- Convert Type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='competition_id') THEN
        ALTER TABLE matches ALTER COLUMN competition_id TYPE TEXT;
    END IF;
END $$;
