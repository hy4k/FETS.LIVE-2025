-- Migration: add_base_centre_to_staff_profiles
-- Created at: 1758318479

-- Add base_centre column to staff_profiles table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_profiles' AND column_name = 'base_centre') THEN
        ALTER TABLE staff_profiles ADD COLUMN base_centre text CHECK (base_centre IN ('calicut', 'cochin'));
    END IF;
END $$;

-- Update staff_profiles with base centre assignments
UPDATE staff_profiles 
SET base_centre = 'calicut'
WHERE full_name IN ('Aysha', 'Nilufer', 'House Keeping');

UPDATE staff_profiles 
SET base_centre = 'cochin'
WHERE full_name IN ('JAYAKANTH JAYADEVAN', 'Blessy K Shibu', 'Raziya Farsana');

-- Super admins have no base centre (they manage all centres)
UPDATE staff_profiles 
SET base_centre = NULL
WHERE full_name IN ('Mithun', 'Niyas');

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_staff_profiles_base_centre ON staff_profiles(base_centre);;