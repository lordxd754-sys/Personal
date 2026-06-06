import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass } = await request.json() as {
      smtpHost: string
      smtpPort?: number
      smtpUser: string
      smtpPass: string
      smtpFrom?: string
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort || 587,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.verify()
    return NextResponse.json({ success: true, message: 'Conexão SMTP estabelecida com sucesso!' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Falha na conexão: ${message}` }, { status: 400 })
  }
}
