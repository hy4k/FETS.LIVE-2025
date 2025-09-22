-- Migration: add_constraints_and_branch_status
-- Created at: 1758316923

-- Add constraints to all branch columns
ALTER TABLE profiles 
ADD CONSTRAINT IF NOT EXISTS check_branch_assigned CHECK (branch_assigned IN ('calicut', 'cochin', 'both')),
ADD CONSTRAINT IF NOT EXISTS check_access_level CHECK (access_level IN ('staff', 'admin', 'super_admin'));

ALTER TABLE candidates 
ADD CONSTRAINT IF NOT EXISTS check_branch_location_candidates CHECK (branch_location IN ('calicut', 'cochin'));

ALTER TABLE incidents 
ADD CONSTRAINT IF NOT EXISTS check_branch_location_incidents CHECK (branch_location IN ('calicut', 'cochin'));

ALTER TABLE roster_schedules 
ADD CONSTRAINT IF NOT EXISTS check_branch_location_roster CHECK (branch_location IN ('calicut', 'cochin'));

ALTER TABLE checklist_instances 
ADD CONSTRAINT IF NOT EXISTS check_branch_location_checklist CHECK (branch_location IN ('calicut', 'cochin'));

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
    candidates_today integer DEFAULT 0,
    incidents_open integer DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(branch_name)
);

-- Create indexes for efficient branch filtering
CREATE INDEX IF NOT EXISTS idx_candidates_branch_location ON candidates(branch_location);
CREATE INDEX IF NOT EXISTS idx_incidents_branch_location ON incidents(branch_location);
CREATE INDEX IF NOT EXISTS idx_roster_schedules_branch_location ON roster_schedules(branch_location);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_assigned ON profiles(branch_assigned);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_branch_location ON checklist_instances(branch_location);
CREATE INDEX IF NOT EXISTS idx_branch_status_name ON branch_status(branch_name);;