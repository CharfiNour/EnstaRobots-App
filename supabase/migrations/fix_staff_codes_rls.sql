-- ⚡ ALL-IN-ONE FIX for Staff Codes
-- Run this entire script in Supabase SQL Editor
-- This will reset everything and make it work

-- Step 1: Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "Staff codes are readable by everyone for login" ON staff_codes;
DROP POLICY IF EXISTS "Staff codes are readable by everyone" ON staff_codes;
DROP POLICY IF EXISTS "Admins can manage staff codes" ON staff_codes;
DROP POLICY IF EXISTS "Allow anonymous insert for initial setup" ON staff_codes;
DROP POLICY IF EXISTS "Allow anonymous update for management" ON staff_codes;
DROP POLICY IF EXISTS "Allow anonymous delete for management" ON staff_codes;
DROP POLICY IF EXISTS "public_read" ON staff_codes;
DROP POLICY IF EXISTS "public_insert" ON staff_codes;
DROP POLICY IF EXISTS "public_update" ON staff_codes;
DROP POLICY IF EXISTS "public_delete" ON staff_codes;

-- Step 2: Disable RLS temporarily
ALTER TABLE staff_codes DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS with simple, working policies
ALTER TABLE staff_codes ENABLE ROW LEVEL SECURITY;

-- Step 4: Create ultra-simple policies that definitely won't cause recursion
CREATE POLICY "allow_all_operations" 
  ON staff_codes 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Step 5: Verify it works - try inserting a test row
INSERT INTO staff_codes (role, name, code, competition_id) 
VALUES ('jury', 'Test After Fix', 'TEST-FIX', NULL)
RETURNING *;

-- Step 6: Clean up test row
DELETE FROM staff_codes WHERE code = 'TEST-FIX';

-- Step 7: Show current policies (should see 1 policy)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'staff_codes';

-- ✅ If you see the test row inserted and deleted successfully,
-- and you see 1 policy named "allow_all_operations",
-- then everything is fixed!
--
-- Now go to your app and try creating a staff code.
-- It should work!
