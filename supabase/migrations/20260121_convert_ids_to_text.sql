-- EnstaRobots - Fix Data Types for Slugs
-- Converts competition identifiers to TEXT to avoid UUID syntax errors

-- 1. Fix live_sessions (as previously planned)
DROP TABLE IF EXISTS live_sessions;
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id TEXT NOT NULL, 
  team_id TEXT NOT NULL,        
  phase TEXT,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT live_sessions_competition_key UNIQUE (competition_id)
);

-- 2. Fix scores (competition_id column often contains slugs like "line_follower")
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop foreign key constraint if it exists
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'scores'::regclass 
      AND confrelid = 'competitions'::regclass;
      
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE scores DROP CONSTRAINT ' || constraint_name;
    END IF;

    -- Convert column type to TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scores' AND column_name='competition_id') THEN
        ALTER TABLE scores ALTER COLUMN competition_id TYPE TEXT;
    END IF;
END $$;

-- 3. Fix staff_codes (competition_id column often contains slugs)
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop foreign key constraint if it exists
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'staff_codes'::regclass 
      AND confrelid = 'competitions'::regclass;
      
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE staff_codes DROP CONSTRAINT ' || constraint_name;
    END IF;

    -- Convert column type to TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff_codes' AND column_name='competition_id') THEN
        ALTER TABLE staff_codes ALTER COLUMN competition_id TYPE TEXT;
    END IF;
END $$;

-- 4. Security & Realtime
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view live sessions" ON live_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can manage live sessions" ON live_sessions FOR ALL USING (true);

-- Ensure they are in the publication
ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;
-- Note: scores is likely already in the publication from schema.sql
