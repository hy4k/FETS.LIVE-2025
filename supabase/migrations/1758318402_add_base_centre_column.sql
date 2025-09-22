-- Migration: add_base_centre_column
-- Created at: 1758318402

-- Add base_centre column to profiles table if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'base_centre') THEN
        ALTER TABLE profiles ADD COLUMN base_centre text CHECK (base_centre IN ('calicut', 'cochin'));
    END IF;
END $$;

-- Create index for efficient base centre queries
CREATE INDEX IF NOT EXISTS idx_profiles_base_centre ON profiles(base_centre);
CREATE INDEX IF NOT EXISTS idx_profiles_access_level ON profiles(access_level);;