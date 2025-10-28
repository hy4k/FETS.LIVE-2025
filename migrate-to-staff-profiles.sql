-- =====================================================
-- Migration Script: Consolidate to staff_profiles Table
-- =====================================================
-- Purpose: Migrate all foreign keys from profiles to staff_profiles
-- Date: 2025-01-28
-- Risk: Low-Medium
-- Backup Required: YES - Create backup before running
-- =====================================================

-- STEP 1: Verify both tables exist and have data
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'staff_profiles' as table_name, COUNT(*) as record_count FROM staff_profiles;

-- STEP 2: Check for data mismatches
-- List users who exist in profiles but not in staff_profiles
SELECT p.id, p.user_id, p.full_name, p.email
FROM profiles p
LEFT JOIN staff_profiles sp ON p.user_id = sp.user_id
WHERE sp.id IS NULL;

-- List users who exist in staff_profiles but not in profiles
SELECT sp.id, sp.user_id, sp.full_name, sp.email
FROM staff_profiles sp
LEFT JOIN profiles p ON sp.user_id = p.user_id
WHERE p.id IS NULL;

-- =====================================================
-- STEP 3: Update Foreign Key Constraints
-- =====================================================

-- 3.1: Update incidents table
-- This table tracks incident reports
DO $$
BEGIN
    -- Drop old constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'incidents_reported_by_fkey'
    ) THEN
        ALTER TABLE incidents DROP CONSTRAINT incidents_reported_by_fkey;
        RAISE NOTICE 'Dropped constraint incidents_reported_by_fkey';
    END IF;

    -- Add new constraint pointing to staff_profiles
    ALTER TABLE incidents
        ADD CONSTRAINT incidents_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES staff_profiles(id)
        ON DELETE CASCADE;

    RAISE NOTICE 'Added constraint incidents_user_id_fkey -> staff_profiles';
END $$;

-- 3.2: Update kudos table (giver_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'kudos_giver_id_fkey'
    ) THEN
        ALTER TABLE kudos DROP CONSTRAINT kudos_giver_id_fkey;
        RAISE NOTICE 'Dropped constraint kudos_giver_id_fkey';
    END IF;

    ALTER TABLE kudos
        ADD CONSTRAINT kudos_giver_id_fkey
        FOREIGN KEY (giver_id)
        REFERENCES staff_profiles(id)
        ON DELETE CASCADE;

    RAISE NOTICE 'Added constraint kudos_giver_id_fkey -> staff_profiles';
END $$;

-- 3.3: Update kudos table (receiver_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'kudos_receiver_id_fkey'
    ) THEN
        ALTER TABLE kudos DROP CONSTRAINT kudos_receiver_id_fkey;
        RAISE NOTICE 'Dropped constraint kudos_receiver_id_fkey';
    END IF;

    ALTER TABLE kudos
        ADD CONSTRAINT kudos_receiver_id_fkey
        FOREIGN KEY (receiver_id)
        REFERENCES staff_profiles(id)
        ON DELETE CASCADE;

    RAISE NOTICE 'Added constraint kudos_receiver_id_fkey -> staff_profiles';
END $$;

-- 3.4: Update vault table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'vault_author_id_fkey'
    ) THEN
        ALTER TABLE vault DROP CONSTRAINT vault_author_id_fkey;
        RAISE NOTICE 'Dropped constraint vault_author_id_fkey';
    END IF;

    ALTER TABLE vault
        ADD CONSTRAINT vault_author_id_fkey
        FOREIGN KEY (author_id)
        REFERENCES staff_profiles(id)
        ON DELETE CASCADE;

    RAISE NOTICE 'Added constraint vault_author_id_fkey -> staff_profiles';
END $$;

-- 3.5: Update vault_item_pins table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'vault_item_pins_user_id_fkey'
    ) THEN
        ALTER TABLE vault_item_pins DROP CONSTRAINT vault_item_pins_user_id_fkey;
        RAISE NOTICE 'Dropped constraint vault_item_pins_user_id_fkey';
    END IF;

    ALTER TABLE vault_item_pins
        ADD CONSTRAINT vault_item_pins_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES staff_profiles(id)
        ON DELETE CASCADE;

    RAISE NOTICE 'Added constraint vault_item_pins_user_id_fkey -> staff_profiles';
END $$;

-- =====================================================
-- STEP 4: Verification Queries
-- =====================================================

-- Verify all foreign keys now point to staff_profiles
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name IN ('profiles', 'staff_profiles')
ORDER BY tc.table_name, tc.constraint_name;

-- Count foreign keys by referenced table
SELECT
    ccu.table_name AS referenced_table,
    COUNT(*) AS foreign_key_count
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name IN ('profiles', 'staff_profiles')
GROUP BY ccu.table_name
ORDER BY foreign_key_count DESC;

-- =====================================================
-- STEP 5: Mark profiles table as deprecated (optional)
-- =====================================================

-- Option 1: Rename profiles table (recommended for safety)
-- Uncomment the line below after verifying everything works
-- ALTER TABLE profiles RENAME TO profiles_deprecated;

-- Option 2: Add a comment to profiles table
COMMENT ON TABLE profiles IS 'DEPRECATED: This table has been replaced by staff_profiles. Foreign keys migrated on 2025-01-28. Will be removed after 30 days.';

-- =====================================================
-- ROLLBACK SCRIPT (Run if needed)
-- =====================================================

/*
-- To rollback, run this script:

-- Rollback incidents
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_user_id_fkey;
ALTER TABLE incidents ADD CONSTRAINT incidents_reported_by_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id);

-- Rollback kudos
ALTER TABLE kudos DROP CONSTRAINT IF EXISTS kudos_giver_id_fkey;
ALTER TABLE kudos ADD CONSTRAINT kudos_giver_id_fkey
    FOREIGN KEY (giver_id) REFERENCES profiles(id);

ALTER TABLE kudos DROP CONSTRAINT IF EXISTS kudos_receiver_id_fkey;
ALTER TABLE kudos ADD CONSTRAINT kudos_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES profiles(id);

-- Rollback vault
ALTER TABLE vault DROP CONSTRAINT IF EXISTS vault_author_id_fkey;
ALTER TABLE vault ADD CONSTRAINT vault_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES profiles(id);

-- Rollback vault_item_pins
ALTER TABLE vault_item_pins DROP CONSTRAINT IF EXISTS vault_item_pins_user_id_fkey;
ALTER TABLE vault_item_pins ADD CONSTRAINT vault_item_pins_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id);

-- Rename table back if it was renamed
-- ALTER TABLE profiles_deprecated RENAME TO profiles;
*/

-- =====================================================
-- END OF MIGRATION SCRIPT
-- =====================================================

SELECT 'Migration completed! Please verify the results above.' AS status;
