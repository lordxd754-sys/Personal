import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'placeholder_gemini_key') {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 400 })
  }

  try {
    const { studentId, template } = await request.json() as { studentId: string; template?: string }

    const { data: student } = await supabaseAdmin.from('Student').select('*').eq('id', studentId).single()
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const s = student as Record<string, unknown>

    const { data: workouts } = await supabaseAdmin
      .from('Workout')
      .select('title')
      .eq('studentId', studentId)
      .eq('status', 'aprovado')
      .order('createdAt', { ascending: false })
      .limit(1)
    const currentWorkout = (workouts?.[0] as Record<string, unknown> | undefined)?.title || 'Sem treino ativo'

    const daysSinceStart = s.createdAt
      ? Math.floor((Date.now() - new Date(s.createdAt as string).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    const daysSinceContact = s.lastContactAt
      ? Math.floor((Date.now() - new Date(s.lastContactAt as string).getTime()) / (1000 * 60 * 60 * 24))
      : null

    const userPrompt = `Aluno: ${s.name} | Objetivo: ${s.goal || 'Não informado'} | Dias desde início: ${daysSinceStart} | Último contato: ${daysSinceContact !== null ? 'há ' + daysSinceContact + ' dias' : 'nunca'} | Treino atual: ${currentWorkout}${template ? ' | Template: ' + template : ''}`

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: 'Você é assistente de personal trainer. Escreva mensagem de acompanhamento personalizada, natural e motivadora. Máximo 3 parágrafos. Sem formalidade excessiva. Em português brasileiro. Retorne apenas o texto da mensagem, sem formatação especial.' }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
      }),
    })

    const geminiData = await response.json() as Record<string, unknown>
    const candidates = geminiData.candidates as Array<Record<string, unknown>>
    const message =
      (((candidates?.[0]?.content as Record<string, unknown>)?.parts as Array<Record<string, unknown>>)?.[0]?.text as string) || ''
    return NextResponse.json({ message })
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: errMessage }, { status: 500 })
  }
}
