import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { sanitizeString } from '@/lib/sanitize'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { data: workout, error } = await supabaseAdmin
      .from('Workout')
      .select('*, Student(*)')
      .eq('id', params.id)
      .single()
    if (error) return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 })

    const { data: sessions, error: sessErr } = await supabaseAdmin
      .from('WorkoutSession')
      .select('*, WorkoutExercise(*)')
      .eq('workoutId', params.id)
      .order('order', { ascending: true })
    if (sessErr) return NextResponse.json({ error: 'Erro ao buscar sessões' }, { status: 500 })

    const sessionsWithSorted = (sessions || []).map((s: Record<string, unknown>) => ({
      ...s,
      WorkoutExercise: ((s.WorkoutExercise as Record<string, unknown>[]) || []).sort(
        (a, b) => (a.order as number) - (b.order as number)
      ),
    }))

    return NextResponse.json({ ...workout, sessions: sessionsWithSorted })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = await request.json()

    const { title, content, status: workoutStatus, sessions: sessionsData } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = sanitizeString(title, 200)
    if (content !== undefined) updateData.content = sanitizeString(content, 10000)
    if (workoutStatus !== undefined && ['rascunho', 'enviado', 'enviado_mfit'].includes(workoutStatus)) {
      updateData.status = workoutStatus
      if (workoutStatus === 'enviado_mfit') updateData.mfitSyncedAt = new Date().toISOString()
    }
    updateData.updatedAt = new Date().toISOString()

    if (Object.keys(updateData).length > 1) {
      await supabaseAdmin.from('Workout').update(updateData).eq('id', params.id)
    }

    if (sessionsData !== undefined && Array.isArray(sessionsData)) {
      await supabaseAdmin.from('WorkoutSession').delete().eq('workoutId', params.id)

      for (const sess of sessionsData) {
        const sessName = sanitizeString(sess.name, 200) || 'Sessão'
        const sessOrder = typeof sess.order === 'number' ? sess.order : 0

        const { data: newSess, error: sessErr } = await supabaseAdmin
          .from('WorkoutSession')
          .insert({ workoutId: params.id, name: sessName, order: sessOrder, warmup: sanitizeString(sess.warmup, 500) || null })
          .select()
          .single()
        if (sessErr) return NextResponse.json({ error: 'Erro ao criar sessão' }, { status: 500 })

        if (sess.exercises && Array.isArray(sess.exercises) && sess.exercises.length > 0) {
          const exercises = sess.exercises.map((ex: Record<string, unknown>, idx: number) => ({
            sessionId: (newSess as Record<string, unknown>).id,
            exerciseId: ex.exerciseId || null,
            name: sanitizeString(ex.name, 200),
            sets: typeof ex.sets === 'number' ? ex.sets : null,
            reps: typeof ex.reps === 'number' ? ex.reps : null,
            rest: typeof ex.rest === 'number' ? ex.rest : 60,
            notes: sanitizeString(ex.notes, 500) || null,
            muscleGroup: sanitizeString(ex.muscleGroup, 100) || null,
            videoUrl: sanitizeString(ex.videoUrl, 500) || null,
            order: typeof ex.order === 'number' ? ex.order : idx + 1,
          }))
          await supabaseAdmin.from('WorkoutExercise').insert(exercises)
        }
      }
    }

    const { data: updated } = await supabaseAdmin
      .from('Workout')
      .select('*, Student(*)')
      .eq('id', params.id)
      .single()
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar treino' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { error } = await supabaseAdmin.from('Workout').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: 'Erro ao excluir treino' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
