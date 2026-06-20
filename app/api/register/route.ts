import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateRegistrationInput } from '@/lib/auth-validation'
import bcrypt from 'bcryptjs'

const REGISTER_RATE_LIMIT_WINDOW_MS = 60_000
const REGISTER_RATE_LIMIT_MAX = 5
const registerAttempts = new Map<string, { count: number; resetAt: number }>()

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip') || 'unknown'
}

function isRateLimited(key: string) {
  const now = Date.now()
  const current = registerAttempts.get(key)

  if (!current || current.resetAt < now) {
    registerAttempts.set(key, { count: 1, resetAt: now + REGISTER_RATE_LIMIT_WINDOW_MS })
    return false
  }

  current.count += 1
  registerAttempts.set(key, current)
  return current.count > REGISTER_RATE_LIMIT_MAX
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' }, { status: 429 })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Formato inválido.' }, { status: 415 })
    }

    const body = await req.json()
    const validation = validateRegistrationInput(body as Record<string, unknown>)

    if (!validation.ok || !validation.value) {
      return NextResponse.json({ error: validation.error || 'Dados inválidos.' }, { status: 400 })
    }

    const { name, email, password } = validation.value

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (lookupError) {
      return NextResponse.json({ error: 'Não foi possível criar a conta agora.' }, { status: 500 })
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true }, { status: 201 })
    }

    const hashed = await bcrypt.hash(password, 12)

    const { error } = await supabaseAdmin.from('User').insert({
      name,
      email,
      password: hashed,
    })

    if (error) {
      return NextResponse.json({ error: 'Não foi possível criar a conta agora.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Não foi possível criar a conta agora.' }, { status: 500 })
  }
}
