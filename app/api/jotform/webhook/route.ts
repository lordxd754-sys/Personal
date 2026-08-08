import { NextRequest, NextResponse } from 'next/server'
import { normalizeStudentIntake, readStudentIntakeRequest } from '@/lib/student-intake'
import { upsertStudentFromIntake } from '@/lib/student-upsert'

function isAuthorized(request: NextRequest) {
  const secret = process.env.JOTFORM_WEBHOOK_SECRET
  if (!secret) return true

  const url = new URL(request.url)
  return (
    request.headers.get('x-jotform-secret') === secret ||
    request.headers.get('x-webhook-secret') === secret ||
    url.searchParams.get('secret') === secret
  )
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const rawBody = await readStudentIntakeRequest(request)
    const bodyObject = rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody) ? rawBody : { raw: rawBody }
    const payload = normalizeStudentIntake(bodyObject)
    const { student, action } = await upsertStudentFromIntake(payload)

    return NextResponse.json({ ok: true, action, student })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao processar webhook' }, { status: 500 })
  }
}
