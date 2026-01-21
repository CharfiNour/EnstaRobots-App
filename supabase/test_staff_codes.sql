-- Quick Test Script for Supabase SQL Editor
-- Run this in Supabase SQL Editor to check if staff_codes table exists

-- Test 1: Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'staff_codes'
) AS table_exists;

-- Test 2: If table exists, count rows
SELECT COUNT(*) as total_codes FROM staff_codes;

-- Test 3: If table exists, show all codes
SELECT 
    id,
    role,
    name,
    code,
    competition_id,
    created_at
FROM staff_codes
ORDER BY created_at DESC;

-- Expected Results:
-- If migration NOT run:
--   - table_exists: false
--   - Other queries will error
--
-- If migration IS run:
--   - table_exists: true
--   - total_codes: 2 (or more if you added codes)
--   - Should see ADMIN-2024 and JURY-2024
