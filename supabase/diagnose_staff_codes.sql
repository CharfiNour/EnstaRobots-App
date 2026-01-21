-- Diagnostic Script: Check staff_codes table status
-- Run this in Supabase SQL Editor to see what's going on

-- 1. Check if table exists
SELECT 'Table exists!' as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'staff_codes';

-- 2. Check current RLS policies
SELECT 
    policyname as policy_name,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'staff_codes'
ORDER BY policyname;

-- 3. Try to insert a test row (this will show the actual error)
INSERT INTO staff_codes (role, name, code, competition_id) 
VALUES ('jury', 'Test Diagnostic', 'TEST-DIAG', NULL);

-- 4. If insert worked, show all codes
SELECT id, role, name, code, competition_id, created_at 
FROM staff_codes 
ORDER BY created_at DESC;

-- 5. Clean up the test row
DELETE FROM staff_codes WHERE code = 'TEST-DIAG';
