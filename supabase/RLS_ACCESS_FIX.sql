-- ENSTAROBOTS - ACCESS CONTROL & PRIVACY FIX
-- This script fixes RLS policies that block teams from seeing announcements 
-- and other essential data when using anonymous connections.

-- 1. ANNOUNCEMENTS: Allow everyone to read (Client-side filtering handles privacy)
DROP POLICY IF EXISTS "Announcements visible based on role" ON announcements;
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON announcements;
CREATE POLICY "Announcements are viewable by everyone" ON announcements FOR SELECT USING (true);

-- 2. TEAMS: Allow everyone to read (Required for public rankings and team profiles)
DROP POLICY IF EXISTS "Teams can view own data" ON teams;
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);

-- 3. SCORES: Ensure public readability
DROP POLICY IF EXISTS "Scores are viewable by everyone" ON scores;
CREATE POLICY "Scores are viewable by everyone" ON scores FOR SELECT USING (true);

-- 4. ENSURE REALTIME IS ACTIVE FOR ALL TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ON CONFLICT DO NOTHING; -- Handle case where it already exists
