-- Add mandate fields to players table
-- Run this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

ALTER TABLE players
ADD COLUMN IF NOT EXISTS "hasMandate" BOOLEAN,
ADD COLUMN IF NOT EXISTS "mandateExpiry" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "mandateClubs" TEXT,
ADD COLUMN IF NOT EXISTS "mandateNotes" TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'players'
AND column_name IN ('hasMandate', 'mandateExpiry', 'mandateClubs', 'mandateNotes')
ORDER BY column_name;
