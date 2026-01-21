-- EnstaRobots - Fix Live Sessions Unique Constraint
-- Only one live session allowed per competition category

-- First, clear duplicates if any (keep latest)
DELETE FROM live_sessions a
USING live_sessions b
WHERE a.id < b.id
  AND a.competition_id = b.competition_id;

-- Add unique constraint
ALTER TABLE live_sessions
DROP CONSTRAINT IF EXISTS live_sessions_competition_id_key;

ALTER TABLE live_sessions
ADD CONSTRAINT live_sessions_competition_id_key UNIQUE (competition_id);
