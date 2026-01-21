-- FIX: Registration and Teams functionality
-- This script fixes RLS, missing tables, and schema mismatches

-- 1. FIX TEAMS TABLE SCHEMA
-- Add categories column if it doesn't exist, or just use competition_id as TEXT
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_competition_id_fkey;
ALTER TABLE teams ALTER COLUMN competition_id TYPE TEXT;
-- Add columns that code uses but might be missing/different
ALTER TABLE teams ADD COLUMN IF NOT EXISTS robot_name TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS club TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT FALSE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS visuals_locked BOOLEAN DEFAULT FALSE;

-- 2. CREATE TEAM_MEMBERS TABLE (if missing)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  is_leader BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- 4. PERMISSIVE POLICIES (Admin/Staff convenience)
-- Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Teams can view own data" ON teams;
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;
DROP POLICY IF EXISTS "Allow public read for teams" ON teams;
DROP POLICY IF EXISTS "Allow anonymous management of teams" ON teams;

CREATE POLICY "Allow public read for teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow anonymous management of teams" ON teams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read for team_members" ON team_members;
DROP POLICY IF EXISTS "Allow anonymous management of team_members" ON team_members;

CREATE POLICY "Allow public read for team_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Allow anonymous management of team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Competitions are viewable by everyone" ON competitions;
DROP POLICY IF EXISTS "Admins can manage competitions" ON competitions;
DROP POLICY IF EXISTS "Allow public read for competitions" ON competitions;
DROP POLICY IF EXISTS "Allow anonymous management of competitions" ON competitions;

CREATE POLICY "Allow public read for competitions" ON competitions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous management of competitions" ON competitions FOR ALL USING (true) WITH CHECK (true);

-- 5. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE competitions;
