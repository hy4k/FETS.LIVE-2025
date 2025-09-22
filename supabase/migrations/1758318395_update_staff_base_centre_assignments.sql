-- Migration: update_staff_base_centre_assignments
-- Created at: 1758318395

-- Update existing staff with specific base centre assignments as requested

-- Update Calicut Centre Staff
UPDATE profiles 
SET branch_assigned = 'calicut', access_level = 'staff'
WHERE full_name = 'Aysha';

UPDATE profiles 
SET branch_assigned = 'calicut', access_level = 'staff'
WHERE full_name = 'Nilufer';

UPDATE profiles 
SET branch_assigned = 'calicut', access_level = 'staff', full_name = 'House Keeping'
WHERE full_name = 'HK';

-- Insert Cochin Centre Staff (if they don't exist)
INSERT INTO profiles (full_name, role, branch_assigned, access_level, email, user_id)
VALUES 
  ('JAYAKANTH JAYADEVAN', 'staff', 'cochin', 'staff', 'jayakanth@fets.live', gen_random_uuid()),
  ('Blessy K Shibu', 'staff', 'cochin', 'staff', 'blessy@fets.live', gen_random_uuid()),
  ('Raziya Farsana', 'staff', 'cochin', 'staff', 'raziya@fets.live', gen_random_uuid())
ON CONFLICT (email) DO UPDATE SET
  branch_assigned = EXCLUDED.branch_assigned,
  access_level = EXCLUDED.access_level,
  full_name = EXCLUDED.full_name;

-- Ensure Super Administrators are properly configured
UPDATE profiles 
SET 
  role = 'super_admin',
  branch_assigned = 'both',
  access_level = 'super_admin'
WHERE full_name IN ('Mithun', 'Niyas');

-- Add base_centre column to profiles table if it doesn't exist (for explicit centre assignment)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'base_centre') THEN
        ALTER TABLE profiles ADD COLUMN base_centre text CHECK (base_centre IN ('calicut', 'cochin'));
    END IF;
END $$;

-- Update base_centre field based on branch_assigned for staff
UPDATE profiles 
SET base_centre = CASE 
  WHEN branch_assigned = 'calicut' AND access_level != 'super_admin' THEN 'calicut'
  WHEN branch_assigned = 'cochin' AND access_level != 'super_admin' THEN 'cochin'
  ELSE NULL
END
WHERE access_level != 'super_admin';

-- Create index for efficient base centre queries
CREATE INDEX IF NOT EXISTS idx_profiles_base_centre ON profiles(base_centre);
CREATE INDEX IF NOT EXISTS idx_profiles_access_level ON profiles(access_level);;