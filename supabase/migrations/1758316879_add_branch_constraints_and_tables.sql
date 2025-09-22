-- Migration: add_branch_constraints_and_tables
-- Created at: 1758316879

-- Step 2: Add constraints and create branch status table

-- Add constraints to branch columns
ALTER TABLE profiles 
ADD CONSTRAINT check_branch_assigned CHECK (branch_assigned IN ('calicut', 'cochin', 'both')),
ADD CONSTRAINT check_access_level CHECK (access_level IN ('staff', 'admin', 'super_admin'));

ALTER TABLE candidates 
ADD CONSTRAINT check_branch_location_candidates CHECK (branch_location IN ('calicut', 'cochin'));

ALTER TABLE incidents 
ADD CONSTRAINT check_branch_location_incidents CHECK (branch_location IN ('calicut', 'cochin'));

ALTER TABLE roster_schedules 
ADD CONSTRAINT check_branch_location_roster CHECK (branch_location IN ('calicut', 'cochin'));

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
    system_health text DEFAULT 'ok' CHECK (system_health IN ('ok', 'warning', 'critical')),
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Create checklist_instances table if it doesn't exist
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

-- Create indexes for efficient branch filtering
CREATE INDEX IF NOT EXISTS idx_candidates_branch_location ON candidates(branch_location);
CREATE INDEX IF NOT EXISTS idx_incidents_branch_location ON incidents(branch_location);
CREATE INDEX IF NOT EXISTS idx_roster_schedules_branch_location ON roster_schedules(branch_location);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_assigned ON profiles(branch_assigned);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_branch_location ON checklist_instances(branch_location);
CREATE INDEX IF NOT EXISTS idx_branch_status_name ON branch_status(branch_name);;