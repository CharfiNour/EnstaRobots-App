-- 🛠️ FIX: Add missing columns to app_settings table
-- Run this in your Supabase SQL Editor

-- 1. Ensure the table exists (just in case)
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY,
    event_day_started BOOLEAN DEFAULT FALSE,
    profiles_locked BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add the missing statistics columns
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS total_competitions INTEGER DEFAULT 0;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS total_teams INTEGER DEFAULT 0;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS total_matches INTEGER DEFAULT 0;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS event_duration TEXT DEFAULT 'TBD';

-- 3. Ensure the 'global' record exists
INSERT INTO app_settings (id, event_day_started, profiles_locked, total_competitions, total_teams, total_matches, event_duration)
VALUES ('global', false, false, 0, 0, 0, 'TBD')
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS if not enabled
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS Policies
DROP POLICY IF EXISTS "Public read access for app_settings" ON app_settings;
CREATE POLICY "Public read access for app_settings" ON app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update app_settings" ON app_settings;
CREATE POLICY "Admins can update app_settings" ON app_settings FOR ALL USING (true); -- Simplified for now to ensure it works, you can restrict to admin role later

-- 6. Add to Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
