import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { sanitizeString, sanitizeNumber } from '@/lib/sanitize'
import nodemailer from 'nodemailer'

const BLOCKED_HOSTS = ['127.0.0.1', 'localhost', '0.0.0.0', '169.254.169.254', 'metadata.google.internal', '192.168.0.0/16', '10.0.0.0/8']

function isSafeHost(host: string): boolean {
  const normalized = host.toLowerCase().trim()
  for (const blocked of BLOCKED_HOSTS) {
    if (normalized === blocked || normalized.startsWith(blocked.replace('/16', '.').replace('/8', '.'))) {
      return false
    }
  }
  if (/^127\./.test(normalized) || /^10\./.test(normalized) || /^192\.168\./.test(normalized) || /^172\.(1[6-9]|2\d|3[01])\./.test(normalized)) {
    return false
  }
  return true
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = await request.json() as Record<string, unknown>
    const smtpHost = sanitizeString(body.smtpHost, 255)
    const smtpPort = sanitizeNumber(body.smtpPort, 1, 65535) || 587
    const smtpUser = sanitizeString(body.smtpUser, 255)
    const smtpPass = sanitizeString(body.smtpPass, 255)

    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    if (!isSafeHost(smtpHost)) {
      return NextResponse.json({ error: 'Host SMTP não permitido' }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.verify()
    return NextResponse.json({ success: true, message: 'Conexão SMTP estabelecida com sucesso!' })
  } catch {
    return NextResponse.json({ error: 'Falha na conexão SMTP' }, { status: 400 })
  }
}
