-- EnstaRobots - Add Competition Name to Staff Codes
-- This allows displaying the competition name as a badge in the UI

ALTER TABLE staff_codes
ADD COLUMN IF NOT EXISTS competition_name TEXT;

-- Initialize competition_name for existing entries if possible
-- (Logic: Extract from name if it contains parentheses)
UPDATE staff_codes
SET competition_name = SUBSTRING(name FROM '\((.*)\)')
WHERE name LIKE '%(%)%' AND competition_name IS NULL;
