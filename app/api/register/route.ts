import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string; email?: string; password?: string }
    const { name, email, password } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome deve ter pelo menos 2 caracteres.' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const { error } = await supabaseAdmin.from('User').insert({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
    })

    if (error) throw error

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
