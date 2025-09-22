-- Migration: insert_cochin_staff
-- Created at: 1758318418

-- Insert Cochin Centre Staff
INSERT INTO profiles (full_name, role, branch_assigned, access_level, base_centre, email, user_id)
VALUES 
  ('JAYAKANTH JAYADEVAN', 'staff', 'cochin', 'staff', 'cochin', 'jayakanth@fets.live', gen_random_uuid()),
  ('Blessy K Shibu', 'staff', 'cochin', 'staff', 'cochin', 'blessy@fets.live', gen_random_uuid()),
  ('Raziya Farsana', 'staff', 'cochin', 'staff', 'cochin', 'raziya@fets.live', gen_random_uuid());;