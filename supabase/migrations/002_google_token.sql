-- GoogleToken: stores Google OAuth tokens per user for Calendar API access
CREATE TABLE IF NOT EXISTS "GoogleToken" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("userId")
);

CREATE INDEX IF NOT EXISTS idx_google_token_user ON "GoogleToken"("userId");
