-- Internal agenda table
CREATE TABLE IF NOT EXISTS "AgendaEvent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  "studentId" UUID REFERENCES "Student"(id) ON DELETE SET NULL,
  "startAt" TIMESTAMPTZ NOT NULL,
  "endAt" TIMESTAMPTZ,
  type TEXT NOT NULL DEFAULT 'sessao' CHECK (type IN ('sessao', 'avaliacao', 'compromisso', 'outro')),
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'concluido', 'cancelado')),
  notes TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_event_start ON "AgendaEvent"("startAt");
CREATE INDEX IF NOT EXISTS idx_agenda_event_student ON "AgendaEvent"("studentId");
