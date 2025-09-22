-- Migration: populate_branch_data
-- Created at: 1758316957

-- Insert initial branch status records
INSERT INTO branch_status (branch_name, workstations_total, workstations_active, staff_total, staff_present, candidates_today, system_health) 
VALUES 
    ('calicut', 15, 12, 12, 8, 15, 'ok'),
    ('cochin', 15, 14, 12, 10, 12, 'ok')
ON CONFLICT (branch_name) DO UPDATE SET
    workstations_total = EXCLUDED.workstations_total,
    workstations_active = EXCLUDED.workstations_active,
    staff_total = EXCLUDED.staff_total,
    staff_present = EXCLUDED.staff_present,
    candidates_today = EXCLUDED.candidates_today,
    system_health = EXCLUDED.system_health,
    last_updated = now();

-- Update existing data with realistic branch assignments
-- Assign 60% to Calicut, 40% to Cochin for realistic distribution
UPDATE candidates 
SET branch_location = CASE 
    WHEN random() < 0.6 THEN 'calicut' 
    ELSE 'cochin' 
END 
WHERE branch_location = 'calicut';

UPDATE incidents 
SET branch_location = CASE 
    WHEN random() < 0.6 THEN 'calicut' 
    ELSE 'cochin' 
END 
WHERE branch_location = 'calicut';

UPDATE roster_schedules 
SET branch_location = CASE 
    WHEN random() < 0.6 THEN 'calicut' 
    ELSE 'cochin' 
END 
WHERE branch_location = 'calicut';

UPDATE checklist_instances 
SET branch_location = CASE 
    WHEN random() < 0.6 THEN 'calicut' 
    ELSE 'cochin' 
END 
WHERE branch_location = 'calicut';

-- Update profiles with role-based branch access
UPDATE profiles 
SET 
    branch_assigned = CASE 
        WHEN full_name ILIKE '%mithun%' OR full_name ILIKE '%niyas%' THEN 'both'
        WHEN random() < 0.7 THEN 'calicut' 
        ELSE 'cochin' 
    END,
    access_level = CASE 
        WHEN full_name ILIKE '%mithun%' OR full_name ILIKE '%niyas%' THEN 'super_admin'
        WHEN role IN ('admin', 'manager', 'Admin', 'Manager') THEN 'admin'
        ELSE 'staff'
    END;;