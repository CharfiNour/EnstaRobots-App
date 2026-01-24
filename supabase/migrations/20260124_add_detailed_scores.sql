-- Migration to add detailed scores to the scores table
-- This allows persistent storage of segment-by-segment points for Line Follower and All Terrain
ALTER TABLE scores ADD COLUMN IF NOT EXISTS detailed_scores JSONB;

-- Update the judge_names column name to match code if needed, but we typically use juryNames in JS
-- The schema.sql says judge_names TEXT[], which is fine.
