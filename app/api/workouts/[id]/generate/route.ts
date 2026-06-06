import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const SYSTEM_PROMPT = `Você é um Personal Trainer especialista de alto nível, com formação completa em Educação Física e mais de 15 anos de experiência.

ESPECIALIDADES:
- Hipertrofia: sobrecarga progressiva, periodização (linear, ondulatória, conjugada), técnicas avançadas (drop-set, rest-pause, bi-sets, pré-exaustão)
- Emagrecimento: HIIT, circuitos, efeito EPOC, recomposição corporal
- Cinesiologia: padrões de movimento, planos corporais, análise biomecânica
- Anatomia: origem, inserção e função de cada músculo, músculos sinergistas
- Fisiologia: adaptações neuromusculares, bioenergética (ATP-CP, glicolítico, oxidativo)

REGRAS OBRIGATÓRIAS:
1. Aquecimento específico por sessão
2. Multiarticulares antes de monoarticulares
3. Iniciante: 2-3x12-15 | Intermediário: 3-4x8-12 | Avançado: 4-5x com técnicas avançadas
4. 2-3 dias: Full Body | 4 dias: Push/Pull ou Upper/Lower | 5+: PPL ou ABCDx
5. Descanso: Força(3-5min) | Hipertrofia(60-120s) | Definição(30-60s)
6. JAMAIS prescrever exercícios contraindicados para lesões informadas
7. Observações técnicas detalhadas em CADA exercício

Responda SEMPRE em português brasileiro.
Responda APENAS com o JSON solicitado, sem texto antes ou depois.

Formato JSON obrigatório:
{
  "title": "Nome do treino",
  "generalNotes": "Orientações gerais de progressão",
  "sessions": [
    {
      "name": "Treino A - Peito e Tríceps",
      "order": 1,
      "warmup": "5 min esteira leve + ativação",
      "exercises": [
        {
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "8-12",
          "rest": 90,
          "notes": "Escápulas retraídas, controle excêntrico de 3s",
          "order": 1,
          "muscleGroup": "Peito"
        }
      ]
    }
  ]
}`

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'placeholder_gemini_key') {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 400 })
  }

  try {
    const { data: workout, error: wErr } = await supabaseAdmin
      .from('Workout')
      .select('*, Student(*)')
      .eq('id', params.id)
      .single()
    if (wErr) throw wErr

    const student = workout.Student as Record<string, unknown>

    // Get latest assessment
    const { data: assessments } = await supabaseAdmin
      .from('PhysicalAssessment')
      .select('*')
      .eq('studentId', student.id as string)
      .order('assessedAt', { ascending: false })
      .limit(1)
    const latestAssessment = assessments?.[0] || null

    // Get settings/preferences
    const { data: settingsArr } = await supabaseAdmin.from('Settings').select('workoutPreferences').limit(1)
    const preferences = (settingsArr?.[0] as Record<string, unknown> | undefined)?.workoutPreferences || ''

    // Build user prompt
    const age = student.birthdate
      ? Math.floor((Date.now() - new Date(student.birthdate as string).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : null

    const userPrompt = `
Crie um treino completo para o seguinte aluno:

Nome: ${student.name}
Idade: ${age ? age + ' anos' : 'não informada'}
Objetivo: ${student.goal || 'Não informado'}
Nível: ${student.level}
Dias por semana: ${student.daysPerWeek}
Duração por sessão: ${student.sessionDuration} minutos
Restrições/Lesões: ${student.restrictions || 'Nenhuma'}
Equipamentos disponíveis: ${student.equipment || 'Academia completa'}
Observações: ${student.notes || ''}
${latestAssessment ? `
Avaliação física recente (${new Date((latestAssessment as Record<string, unknown>).assessedAt as string).toLocaleDateString('pt-BR')}):
- Peso: ${(latestAssessment as Record<string, unknown>).weight}kg
- Altura: ${(latestAssessment as Record<string, unknown>).height}cm
- % Gordura: ${(latestAssessment as Record<string, unknown>).bodyFatPercent}%
- Massa Magra: ${(latestAssessment as Record<string, unknown>).leanMassKg}kg
- Massa Gorda: ${(latestAssessment as Record<string, unknown>).fatMassKg}kg
- IMC: ${(latestAssessment as Record<string, unknown>).bmi}
- Classificação: ${(latestAssessment as Record<string, unknown>).classification || 'Não classificado'}
` : 'Sem avaliação física registrada.'}
${preferences ? `\nProtocolo do personal trainer:\n${preferences}` : ''}

Crie o treino agora:`.trim()

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API error: ${errText}`)
    }

    const geminiData = await response.json() as Record<string, unknown>
    const candidates = geminiData.candidates as Array<Record<string, unknown>>
    const rawText =
      (((candidates?.[0]?.content as Record<string, unknown>)?.parts as Array<Record<string, unknown>>)?.[0]?.text as string) || ''

    // Parse JSON (strip markdown fences if present)
    let jsonStr = rawText.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    const aiWorkout = JSON.parse(jsonStr) as {
      title: string
      generalNotes: string
      sessions: Array<{
        name: string
        order: number
        warmup?: string
        exercises: Array<{
          name: string
          sets: number
          reps: string
          rest?: number
          notes?: string
          order?: number
          muscleGroup?: string
        }>
      }>
    }

    // Update workout title + content
    await supabaseAdmin.from('Workout').update({
      title: aiWorkout.title,
      content: JSON.stringify({ generalNotes: aiWorkout.generalNotes }),
    }).eq('id', params.id)

    // Replace sessions
    await supabaseAdmin.from('WorkoutSession').delete().eq('workoutId', params.id)

    for (const sess of (aiWorkout.sessions || [])) {
      const { data: newSess } = await supabaseAdmin
        .from('WorkoutSession')
        .insert({ workoutId: params.id, name: sess.name, order: sess.order, warmup: sess.warmup || null })
        .select()
        .single()
      if (newSess && sess.exercises) {
        const exercises = sess.exercises.map((ex, idx) => ({
          sessionId: (newSess as Record<string, unknown>).id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest || 60,
          notes: ex.notes || null,
          muscleGroup: ex.muscleGroup || null,
          order: ex.order ?? idx + 1,
        }))
        await supabaseAdmin.from('WorkoutExercise').insert(exercises)
      }
    }

    // Return full updated workout
    const { data: finalWorkout } = await supabaseAdmin
      .from('Workout')
      .select('*, Student(*)')
      .eq('id', params.id)
      .single()
    const { data: finalSessions } = await supabaseAdmin
      .from('WorkoutSession')
      .select('*, WorkoutExercise(*)')
      .eq('workoutId', params.id)
      .order('order', { ascending: true })

    return NextResponse.json({ ...finalWorkout, sessions: finalSessions })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
