-- Migration: add_branch_columns_step1
-- Created at: 1758316863

-- Step 1: Add branch columns to all tables

-- Add branch assignment to profiles table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'branch_assigned') THEN
        ALTER TABLE profiles ADD COLUMN branch_assigned text DEFAULT 'calicut';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'access_level') THEN
        ALTER TABLE profiles ADD COLUMN access_level text DEFAULT 'staff';
    END IF;
END $$;

-- Add branch location to candidates table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'branch_location') THEN
        ALTER TABLE candidates ADD COLUMN branch_location text DEFAULT 'calicut';
    END IF;
END $$;

-- Add branch location to incidents table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'branch_location') THEN
        ALTER TABLE incidents ADD COLUMN branch_location text DEFAULT 'calicut';
    END IF;
END $$;

-- Add branch location to roster_schedules table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roster_schedules' AND column_name = 'branch_location') THEN
        ALTER TABLE roster_schedules ADD COLUMN branch_location text DEFAULT 'calicut';
    END IF;
END $$;;