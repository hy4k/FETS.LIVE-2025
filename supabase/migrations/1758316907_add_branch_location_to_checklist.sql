-- Migration: add_branch_location_to_checklist
-- Created at: 1758316907

-- Add branch location to checklist_instances table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checklist_instances' AND column_name = 'branch_location') THEN
        ALTER TABLE checklist_instances ADD COLUMN branch_location text DEFAULT 'calicut';
    END IF;
END $$;;