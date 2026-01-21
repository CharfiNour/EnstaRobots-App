-- EnstaRobots World Cup - Supabase Schema
-- Execute this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (Judges & Admins linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'judge')),
  full_name TEXT,
  assigned_competitions TEXT[], -- For judges
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitions
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('junior_line_follower', 'junior_all_terrain', 'line_follower', 'all_terrain', 'fight')),
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'qualifiers', 'group_stage', 'knockout', 'finals', 'completed')),
  description TEXT,
  total_teams INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  arena_ids TEXT[],
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams (Competitors)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  team_code TEXT UNIQUE NOT NULL, -- Used for login
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  robot_name TEXT,
  school TEXT,
  members TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Arenas
CREATE TABLE arenas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  round TEXT NOT NULL,
  arena_id UUID REFERENCES arenas(id),
  team1_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  team2_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES teams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scores
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- For Line Follower & All Terrain
  time_ms INTEGER,
  penalties INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  
  -- For Fight
  knockouts INTEGER DEFAULT 0,
  judge_points INTEGER DEFAULT 0,
  damage_score INTEGER DEFAULT 0,
  
  -- Calculated total
  total_points INTEGER NOT NULL,
  
  judge_id UUID REFERENCES profiles(id), -- Who scored this
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'urgent')),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE, -- null = global
  visible_to TEXT NOT NULL CHECK (visible_to IN ('all', 'teams', 'judges', 'admins')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Staff Codes (for jury/admin login without email/password)
CREATE TABLE staff_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('admin', 'jury')),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE arenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_codes ENABLE ROW LEVEL SECURITY;

-- Competitions: Public read, admin write
CREATE POLICY "Competitions are viewable by everyone" ON competitions FOR SELECT USING (true);
CREATE POLICY "Admins can manage competitions" ON competitions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Teams: Teams can read own data, admins can manage
CREATE POLICY "Teams can view own data" ON teams FOR SELECT USING (
  id IN (SELECT id FROM teams WHERE team_code = current_setting('request.jwt.claims', true)::json->>'team_code')
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'judge'))
);
CREATE POLICY "Admins can manage teams" ON teams FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Matches: Public read, restricted write
CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (true);
CREATE POLICY "Admins can manage matches" ON matches FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Scores: Public read, judges/admins write
CREATE POLICY "Scores are viewable by everyone" ON scores FOR SELECT USING (true);
CREATE POLICY "Judges and admins can create scores" ON scores FOR INSERT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'judge'))
);
CREATE POLICY "Judges and admins can update scores" ON scores FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'judge'))
);

-- Announcements: Visibility-based read, admin write
CREATE POLICY "Announcements visible based on role" ON announcements FOR SELECT USING (
  visible_to = 'all'
  OR (visible_to = 'teams' AND current_setting('request.jwt.claims', true)::json->>'team_code' IS NOT NULL)
  OR (visible_to = 'judges' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'judge'))
  OR (visible_to = 'admins' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Staff Codes: Public read for login, admin write
CREATE POLICY "Staff codes are readable by everyone" ON staff_codes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert for initial setup" ON staff_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update for management" ON staff_codes FOR UPDATE WITH CHECK (true);
CREATE POLICY "Allow anonymous delete for management" ON staff_codes FOR DELETE USING (true);

-- Indexes for performance
CREATE INDEX idx_matches_competition ON matches(competition_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_scores_match ON scores(match_id);
CREATE INDEX idx_teams_competition ON teams(competition_id);
CREATE INDEX idx_teams_code ON teams(team_code);
CREATE INDEX idx_staff_codes_code ON staff_codes(code);
CREATE INDEX idx_staff_codes_role ON staff_codes(role);

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE scores;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_codes;
