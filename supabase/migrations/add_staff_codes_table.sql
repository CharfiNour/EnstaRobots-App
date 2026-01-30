-- Add staff_codes table for jury and admin authentication
-- This table stores access codes for staff members to log in without email/password

CREATE TABLE IF NOT EXISTS staff_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('admin', 'jury', 'homologation_jury')),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE staff_codes ENABLE ROW LEVEL SECURITY;

-- Public can read staff codes for login verification
CREATE POLICY "Staff codes are readable by everyone for login" 
  ON staff_codes FOR SELECT 
  USING (true);

-- Allow anonymous inserts (for initial setup without auth)
-- This is needed since the admin panel doesn't use auth.users
CREATE POLICY "Allow anonymous insert for initial setup" 
  ON staff_codes FOR INSERT 
  WITH CHECK (true);

-- Allow anonymous updates (for admin panel)
CREATE POLICY "Allow anonymous update for management" 
  ON staff_codes FOR UPDATE 
  WITH CHECK (true);

-- Allow anonymous deletes (for admin panel)
CREATE POLICY "Allow anonymous delete for management" 
  ON staff_codes FOR DELETE 
  USING (true);

-- NOTE: These policies allow unauthenticated access for simplicity
-- If you need stricter security:
-- 1. First fix any recursive policies in the profiles table
-- 2. Then you can add admin-only policies like:
--    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))

-- Index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_staff_codes_code ON staff_codes(code);
CREATE INDEX IF NOT EXISTS idx_staff_codes_role ON staff_codes(role);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE staff_codes;

-- Insert default codes
INSERT INTO staff_codes (role, name, code, competition_id) 
VALUES 
  ('admin', 'Master Admin', 'ADMIN-2024', NULL),
  ('jury', 'Main Jury', 'JURY-2024', NULL)
ON CONFLICT (code) DO NOTHING;
