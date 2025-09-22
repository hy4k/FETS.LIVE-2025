-- Migration: update_existing_staff_assignments
-- Created at: 1758318410

-- Update existing staff with specific base centre assignments as requested

-- Update Calicut Centre Staff
UPDATE profiles 
SET 
  branch_assigned = 'calicut', 
  access_level = 'staff',
  base_centre = 'calicut'
WHERE full_name = 'Aysha';

UPDATE profiles 
SET 
  branch_assigned = 'calicut', 
  access_level = 'staff',
  base_centre = 'calicut'
WHERE full_name = 'Nilufer';

UPDATE profiles 
SET 
  branch_assigned = 'calicut', 
  access_level = 'staff', 
  full_name = 'House Keeping',
  base_centre = 'calicut'
WHERE full_name = 'HK';

-- Ensure Super Administrators are properly configured (no base centre)
UPDATE profiles 
SET 
  role = 'super_admin',
  branch_assigned = 'both',
  access_level = 'super_admin',
  base_centre = NULL
WHERE full_name IN ('Mithun', 'Niyas');;