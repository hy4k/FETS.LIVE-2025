-- Migration: add_branch_support_to_all_tables
-- Created at: 1758316850

-- Add branch field to all relevant tables for multi-branch support

-- Update profiles table to include branch assignment and access level
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS branch_assigned text DEFAULT 'calicut' CHECK (branch_assigned IN ('calicut', 'cochin', 'both')),
ADD COLUMN IF NOT EXISTS access_level text DEFAULT 'staff' CHECK (access_level IN ('staff', 'admin', 'super_admin'));

-- Update candidates table to include branch location
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS branch_location text DEFAULT 'calicut' CHECK (branch_location IN ('calicut', 'cochin'));

-- Update incidents table to include branch location
ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS branch_location text DEFAULT 'calicut' CHECK (branch_location IN ('calicut', 'cochin'));

-- Update roster_schedules table to include branch location
ALTER TABLE roster_schedules 
ADD COLUMN IF NOT EXISTS branch_location text DEFAULT 'calicut' CHECK (branch_location IN ('calicut', 'cochin'));

-- Create branch_status table for real-time status tracking
CREATE TABLE IF NOT EXISTS branch_status (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_name text NOT NULL CHECK (branch_name IN ('calicut', 'cochin')),
    workstations_total integer DEFAULT 15,
    workstations_active integer DEFAULT 0,
    network_status text DEFAULT 'optimal' CHECK (network_status IN ('optimal', 'moderate', 'issues')),
    power_status text DEFAULT 'optimal' CHECK (power_status IN ('optimal', 'moderate', 'issues')),
    staff_total integer DEFAULT 12,
    staff_present integer DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Create checklist_instances table if it doesn't exist (for compatibility)
CREATE TABLE IF NOT EXISTS checklist_instances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_date date NOT NULL,
    branch_location text DEFAULT 'calicut' CHECK (branch_location IN ('calicut', 'cochin')),
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create checklist_instance_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS checklist_instance_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    checklist_instance_id uuid REFERENCES checklist_instances(id) ON DELETE CASCADE,
    item_name text NOT NULL,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Insert initial branch status records
INSERT INTO branch_status (branch_name, workstations_total, workstations_active, staff_total, staff_present) 
VALUES 
    ('calicut', 15, 12, 12, 8),
    ('cochin', 15, 14, 12, 10)
ON CONFLICT DO NOTHING;

-- Create indexes for efficient branch filtering
CREATE INDEX IF NOT EXISTS idx_candidates_branch_location ON candidates(branch_location);
CREATE INDEX IF NOT EXISTS idx_incidents_branch_location ON incidents(branch_location);
CREATE INDEX IF NOT EXISTS idx_roster_schedules_branch_location ON roster_schedules(branch_location);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_assigned ON profiles(branch_assigned);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_branch_location ON checklist_instances(branch_location);;