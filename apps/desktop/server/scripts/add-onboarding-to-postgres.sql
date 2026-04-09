-- Add onboarding fields to Postgres user table so it persists across devices
-- This allows users to maintain their onboarding status when switching devices

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_onboarding ON "user"(onboarding_completed);

-- Update existing users created before onboarding table to mark as completed
-- (users created before Jan 11, 2026 should skip onboarding)
UPDATE "user" 
SET onboarding_completed = TRUE, onboarding_step = 10
WHERE "createdAt" < '2026-01-11 00:00:00' AND onboarding_completed = FALSE;
