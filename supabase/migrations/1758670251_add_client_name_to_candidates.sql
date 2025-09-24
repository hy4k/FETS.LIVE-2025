-- Migration: add_client_name_to_candidates
-- Adds client_name to candidates and backfills based on exam_name

-- 1) Add column with allowed values constraint
ALTER TABLE candidates 
  ADD COLUMN IF NOT EXISTS client_name text;

-- Optional: tighten constraint if column exists but unconstrained
DO 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'candidates' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE candidates 
      ADD CONSTRAINT candidates_client_name_check 
      CHECK (client_name IS NULL OR client_name IN ('PROMETRIC','PEARSON VUE','ETS','PSI','OTHERS'));
  END IF;
END ;

-- 2) Backfill existing rows by mapping exam_name
UPDATE candidates
SET client_name = 'PROMETRIC'
WHERE client_name IS NULL AND exam_name ILIKE '%CMA US%';

UPDATE candidates
SET client_name = 'ETS'
WHERE client_name IS NULL AND (exam_name ILIKE '%GRE%' OR exam_name ILIKE '%TOEFL%');

UPDATE candidates
SET client_name = 'PEARSON VUE'
WHERE client_name IS NULL AND (exam_name IS NOT NULL AND exam_name NOT ILIKE '%CMA US%' AND exam_name NOT ILIKE '%GRE%' AND exam_name NOT ILIKE '%TOEFL%');

-- 3) Default remaining nulls (no exam_name) to OTHERS
UPDATE candidates
SET client_name = 'OTHERS'
WHERE client_name IS NULL;

-- 4) Index for faster filtering by client_name
CREATE INDEX IF NOT EXISTS idx_candidates_client_name ON candidates(client_name);
