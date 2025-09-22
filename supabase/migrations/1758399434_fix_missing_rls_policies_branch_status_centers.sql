-- Migration: fix_missing_rls_policies_branch_status_centers
-- Created at: 1758399434

-- Fix missing RLS policies for branch_status table
ALTER TABLE branch_status ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for branch_status
CREATE POLICY "Users can view branch status" ON branch_status 
FOR SELECT USING (true);

CREATE POLICY "Admins can insert branch status" ON branch_status 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update branch status" ON branch_status 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM staff_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete branch status" ON branch_status 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM staff_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Fix missing RLS policies for centers table  
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for centers
CREATE POLICY "Users can view centers" ON centers 
FOR SELECT USING (true);

CREATE POLICY "Admins can insert centers" ON centers 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update centers" ON centers 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM staff_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete centers" ON centers 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM staff_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);;