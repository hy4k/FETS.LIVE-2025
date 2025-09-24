-- Migration: reassign_cochin_candidates_to_calicut
-- Purpose: Ensure all candidates belong to Calicut by updating any existing
--          Cochin branch assignments to Calicut.

BEGIN;

UPDATE candidates
SET branch_location = 'calicut'
WHERE branch_location = 'cochin';

COMMIT;

-- Quick verification (optional; comment out if your runner disallows SELECTs in migrations)
-- -- SELECT
-- --   (SELECT COUNT(*) FROM candidates WHERE branch_location = 'cochin')  AS cochin_count,
-- --   (SELECT COUNT(*) FROM candidates WHERE branch_location = 'calicut') AS calicut_count;

