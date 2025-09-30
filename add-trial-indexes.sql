-- Add missing indexes to Trial and CalendarEvent tables for performance optimization
-- Run this directly in Supabase SQL Editor to bypass migration locks

-- PART 1: TRIAL TABLE INDEXES (already applied, but included for reference)
CREATE INDEX IF NOT EXISTS trials_tenantid_status_idx
ON trials("tenantId", status);

CREATE INDEX IF NOT EXISTS trials_tenantid_status_scheduledat_idx
ON trials("tenantId", status, "scheduledAt");

-- PART 2: CALENDAR_EVENTS TABLE INDEXES (NEW)
CREATE INDEX IF NOT EXISTS calendar_events_tenantid_type_idx
ON calendar_events("tenantId", type);

CREATE INDEX IF NOT EXISTS calendar_events_tenantid_starttime_endtime_idx
ON calendar_events("tenantId", "startTime", "endTime");

-- Verify all indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('trials', 'calendar_events')
ORDER BY tablename, indexname;
