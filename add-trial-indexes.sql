-- Add missing indexes to Trial table for performance optimization
-- Run this directly in Supabase SQL Editor to bypass migration locks
-- Using CONCURRENTLY to avoid table locks during index creation

-- Check if indexes already exist before creating
DO $$
BEGIN
    -- Add index for tenantId + status queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'trials'
        AND indexname = 'trials_tenantId_status_idx'
    ) THEN
        CREATE INDEX CONCURRENTLY trials_tenantId_status_idx
        ON trials(tenantId, status);
        RAISE NOTICE 'Created index: trials_tenantId_status_idx';
    ELSE
        RAISE NOTICE 'Index already exists: trials_tenantId_status_idx';
    END IF;

    -- Add composite index for tenantId + status + scheduledAt queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'trials'
        AND indexname = 'trials_tenantId_status_scheduledAt_idx'
    ) THEN
        CREATE INDEX CONCURRENTLY trials_tenantId_status_scheduledAt_idx
        ON trials(tenantId, status, scheduledAt);
        RAISE NOTICE 'Created index: trials_tenantId_status_scheduledAt_idx';
    ELSE
        RAISE NOTICE 'Index already exists: trials_tenantId_status_scheduledAt_idx';
    END IF;
END $$;

-- Verify indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'trials'
ORDER BY indexname;
