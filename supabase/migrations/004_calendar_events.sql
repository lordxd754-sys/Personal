-- CalendarEvent: native calendar events stored in Supabase
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  "startDateTime" TIMESTAMPTZ,
  "endDateTime" TIMESTAMPTZ,
  "startDate" DATE,
  "endDate" DATE,
  "allDay" BOOLEAN DEFAULT false,
  color TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_event_user ON "CalendarEvent"("userId");
CREATE INDEX IF NOT EXISTS idx_calendar_event_dates ON "CalendarEvent"("startDateTime", "endDateTime");
