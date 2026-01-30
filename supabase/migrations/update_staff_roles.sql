-- Update staff_codes table to allow homologation_jury role
-- Run this in your Supabase SQL Editor

-- 1. Remove the old constraint
ALTER TABLE staff_codes DROP CONSTRAINT IF EXISTS staff_codes_role_check;

-- 2. Add the updated constraint including 'homologation_jury'
ALTER TABLE staff_codes ADD CONSTRAINT staff_codes_role_check CHECK (role IN ('admin', 'jury', 'homologation_jury'));
