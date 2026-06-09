-- Add Google Calendar OAuth token columns to User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS google_access_token TEXT,
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMPTZ;
