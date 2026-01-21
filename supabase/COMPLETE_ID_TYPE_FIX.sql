-- ENSTAROBOTS - COMPLETE DATABASE FIX (ID TYPES & SLUGS)
-- This script fixes the "invalid input syntax for type uuid" errors by converting 
-- competition and team identifiers to TEXT, allowing both UUIDs and Slugs.

-- 1. FIX LIVE SESSIONS
DROP TABLE IF EXISTS live_sessions;
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id TEXT NOT NULL, 
  team_id TEXT NOT NULL,        
  phase TEXT,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT live_sessions_competition_key UNIQUE (competition_id)
);

-- 2. FIX SCORES (Convert competition_id to TEXT)
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name FROM pg_constraint 
    WHERE conrelid = 'scores'::regclass AND confrelid = 'competitions'::regclass;
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE scores DROP CONSTRAINT ' || constraint_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scores' AND column_name='competition_id') THEN
        ALTER TABLE scores ALTER COLUMN competition_id TYPE TEXT;
    END IF;
END $$;

-- 3. FIX STAFF CODES (Convert competition_id to TEXT + Add competition_name)
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Fix ID Type
    SELECT conname INTO constraint_name FROM pg_constraint 
    WHERE conrelid = 'staff_codes'::regclass AND confrelid = 'competitions'::regclass;
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE staff_codes DROP CONSTRAINT ' || constraint_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff_codes' AND column_name='competition_id') THEN
        ALTER TABLE staff_codes ALTER COLUMN competition_id TYPE TEXT;
    END IF;

    -- Add Competition Name Column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff_codes' AND column_name='competition_name') THEN
        ALTER TABLE staff_codes ADD COLUMN competition_name TEXT;
    END IF;
END $$;

-- 4. FIX TEAMS (Convert competition_id to TEXT)
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name FROM pg_constraint 
    WHERE conrelid = 'teams'::regclass AND confrelid = 'competitions'::regclass;
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE teams DROP CONSTRAINT ' || constraint_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='competition_id') THEN
        ALTER TABLE teams ALTER COLUMN competition_id TYPE TEXT;
    END IF;
END $$;

-- 5. SECURITY & REALTIME
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view live sessions" ON live_sessions;
DROP POLICY IF EXISTS "Anyone can manage live sessions" ON live_sessions;
CREATE POLICY "Anyone can view live sessions" ON live_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can manage live sessions" ON live_sessions FOR ALL USING (true);

-- Ensure Realtime is enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'live_sessions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;
    END IF;
END $$;

-- 6. INITIAL DATA MIGRATION
-- First extract competition name, then strip it from the operator name
UPDATE staff_codes
SET competition_name = SUBSTRING(name FROM '\((.*)\)')
WHERE name LIKE '%(%)%' AND (competition_name IS NULL OR competition_name = '');

UPDATE staff_codes
SET name = TRIM(SPLIT_PART(name, '(', 1))
WHERE name LIKE '%(%)%';
