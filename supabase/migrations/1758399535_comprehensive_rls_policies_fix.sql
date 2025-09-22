-- Migration: comprehensive_rls_policies_fix
-- Created at: 1758399535

-- Ensure proper RLS policies for all critical tables

-- Fix roster_audit_log table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roster_audit_log') THEN
        ALTER TABLE roster_audit_log ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view audit logs" ON roster_audit_log;
        DROP POLICY IF EXISTS "Users can insert audit logs" ON roster_audit_log;
        
        -- Create new policies
        CREATE POLICY "Users can view audit logs" ON roster_audit_log 
        FOR SELECT USING (true);
        
        CREATE POLICY "Users can insert audit logs" ON roster_audit_log 
        FOR INSERT WITH CHECK (
          auth.uid() IS NOT NULL
        );
    END IF;
END $$;

-- Ensure vault table has proper RLS (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vault') THEN
        ALTER TABLE vault ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing problematic policies
        DROP POLICY IF EXISTS "Users can view vault items" ON vault;
        DROP POLICY IF EXISTS "Users can insert vault items" ON vault;
        DROP POLICY IF EXISTS "Users can update vault items" ON vault;
        DROP POLICY IF EXISTS "Users can delete vault items" ON vault;
        
        -- Create comprehensive vault policies
        CREATE POLICY "Users can view vault items" ON vault 
        FOR SELECT USING (
          is_deleted = false AND (
            NOT is_confidential OR 
            EXISTS (
              SELECT 1 FROM staff_profiles 
              WHERE user_id = auth.uid() 
              AND role IN ('admin', 'super_admin')
            )
          )
        );
        
        CREATE POLICY "Authenticated users can insert vault items" ON vault 
        FOR INSERT WITH CHECK (
          auth.uid() IS NOT NULL AND 
          author_id = auth.uid()
        );
        
        CREATE POLICY "Authors and admins can update vault items" ON vault 
        FOR UPDATE USING (
          author_id = auth.uid() OR 
          EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
          )
        );
        
        CREATE POLICY "Authors and admins can delete vault items" ON vault 
        FOR DELETE USING (
          author_id = auth.uid() OR 
          EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
          )
        );
    END IF;
END $$;

-- Ensure vault_categories table has proper RLS (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vault_categories') THEN
        ALTER TABLE vault_categories ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view vault categories" ON vault_categories 
        FOR SELECT USING (true);
        
        CREATE POLICY "Admins can manage vault categories" ON vault_categories 
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
          )
        );
    END IF;
END $$;

-- Fix incidents table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incidents') THEN
        ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view incidents" ON incidents 
        FOR SELECT USING (true);
        
        CREATE POLICY "Authenticated users can insert incidents" ON incidents 
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
        
        CREATE POLICY "Admins can update incidents" ON incidents 
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
          )
        );
    END IF;
END $$;;