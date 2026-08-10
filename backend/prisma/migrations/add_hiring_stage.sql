-- Migration: add hiringStage + notes + updatedAt to Shortlist table
-- Run this once in your Postgres DB (via docker exec or pgAdmin)

ALTER TABLE "Shortlist" 
  ADD COLUMN IF NOT EXISTS "hiringStage" TEXT NOT NULL DEFAULT 'SHORTLISTED',
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW();

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Shortlist';
