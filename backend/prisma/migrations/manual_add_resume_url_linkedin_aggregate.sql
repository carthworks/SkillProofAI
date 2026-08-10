-- Migration: add_resume_url_linkedin_aggregate_score
-- Run this against your PostgreSQL database (the one in .env DATABASE_URL)

-- 1. On User table: replace resumeS3Key with resumeUrl, add linkedinUrl & aggregateScore
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "resumeUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "aggregateScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Copy existing S3 keys to resumeUrl so nothing is lost (optional, S3 key becomes URL marker)
UPDATE "User" SET "resumeUrl" = '/uploads/resumes/' || id || '/resume.pdf' WHERE "resumeS3Key" IS NOT NULL AND "resumeS3Key" != '';

-- Drop old column
ALTER TABLE "User" DROP COLUMN IF EXISTS "resumeS3Key";

-- 2. On Submission table: add codeContent and language columns
ALTER TABLE "Submission"
  ADD COLUMN IF NOT EXISTS "codeContent" TEXT,
  ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'python';

-- 3. On PsychProfile table: add architecture, overallScore, updatedAt; add defaults to existing cols
ALTER TABLE "PsychProfile"
  ADD COLUMN IF NOT EXISTS "architecture" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "overallScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update overallScore for existing records
UPDATE "PsychProfile" 
SET "overallScore" = ROUND((logical + detail + persistence + learning) / 4.0)
WHERE "overallScore" = 0;

-- Make existing trait columns nullable-safe (they may have no default)
ALTER TABLE "PsychProfile" ALTER COLUMN "logical" SET DEFAULT 0;
ALTER TABLE "PsychProfile" ALTER COLUMN "detail" SET DEFAULT 0;
ALTER TABLE "PsychProfile" ALTER COLUMN "persistence" SET DEFAULT 0;
ALTER TABLE "PsychProfile" ALTER COLUMN "learning" SET DEFAULT 0;
