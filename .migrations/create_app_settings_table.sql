-- ================================================================
-- EnstaRobots: Global App Settings Table
-- ================================================================
-- This creates a single-row table to store global application state
-- like event_day_started, avoiding per-competition flag confusion.

-- 1. Create the app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY,
  event_day_started BOOLEAN NOT NULL DEFAULT FALSE,
  profiles_locked BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Insert the single global row
INSERT INTO public.app_settings (id, event_day_started, profiles_locked)
VALUES ('global', FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 3. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 5. Everyone can READ (visitors, teams, jury, admin)
DROP POLICY IF EXISTS "read app settings" ON public.app_settings;
CREATE POLICY "read app settings"
ON public.app_settings FOR SELECT
TO PUBLIC
USING (TRUE);

-- 6. Only ADMIN can UPDATE
-- NOTE: Adjust this based on your auth system
-- Option A: If you use Supabase Auth with profiles table
DROP POLICY IF EXISTS "admin update app settings" ON public.app_settings;
CREATE POLICY "admin update app settings"
ON public.app_settings FOR UPDATE
TO AUTHENTICATED
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Option B: If you DON'T use Supabase Auth (staff codes only)
-- Then RLS won't work well - you'll need to handle authorization in your code
-- OR create a service role key for admin operations

-- 7. Verify the setup
SELECT * FROM public.app_settings;

-- Expected output:
-- id     | event_day_started | profiles_locked | updated_at | created_at
-- -------+-------------------+-----------------+------------+------------
-- global | false             | false           | <timestamp>| <timestamp>

COMMENT ON TABLE public.app_settings IS 'Global application configuration (single row)';
COMMENT ON COLUMN public.app_settings.event_day_started IS 'Controls visitor/team access to matches, scores, and announcements';
COMMENT ON COLUMN public.app_settings.profiles_locked IS 'Controls whether teams can edit their profiles';
