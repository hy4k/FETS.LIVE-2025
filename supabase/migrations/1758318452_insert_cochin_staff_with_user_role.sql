-- Migration: insert_cochin_staff_with_user_role
-- Created at: 1758318452

-- Insert Cochin Centre Staff with 'user' role (which is allowed by the constraint)
INSERT INTO profiles (full_name, role, branch_assigned, access_level, base_centre, email, user_id)
VALUES 
  ('JAYAKANTH JAYADEVAN', 'user', 'cochin', 'staff', 'cochin', 'jayakanth@fets.live', gen_random_uuid()),
  ('Blessy K Shibu', 'user', 'cochin', 'staff', 'cochin', 'blessy@fets.live', gen_random_uuid()),
  ('Raziya Farsana', 'user', 'cochin', 'staff', 'cochin', 'raziya@fets.live', gen_random_uuid());;