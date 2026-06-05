import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data: workout, error } = await supabaseAdmin
      .from('Workout')
      .select('*, Student(*)')
      .eq('id', params.id)
      .single()
    if (error) throw error

    const { data: sessions, error: sessErr } = await supabaseAdmin
      .from('WorkoutSession')
      .select('*, WorkoutExercise(*)')
      .eq('workoutId', params.id)
      .order('order', { ascending: true })
    if (sessErr) throw sessErr

    // Sort exercises within each session
    const sessionsWithSorted = (sessions || []).map((s: Record<string, unknown>) => ({
      ...s,
      WorkoutExercise: ((s.WorkoutExercise as Record<string, unknown>[]) || []).sort(
        (a, b) => (a.order as number) - (b.order as number)
      ),
    }))

    return NextResponse.json({ ...workout, sessions: sessionsWithSorted })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()

    const { title, content, status: workoutStatus, sessions: sessionsData } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (workoutStatus !== undefined) updateData.status = workoutStatus
    if (workoutStatus === 'enviado_mfit') updateData.mfitSyncedAt = new Date().toISOString()

    if (Object.keys(updateData).length > 0) {
      await supabaseAdmin.from('Workout').update(updateData).eq('id', params.id)
    }

    // If sessions are provided, replace them
    if (sessionsData !== undefined) {
      // Delete existing sessions (cascade deletes exercises)
      await supabaseAdmin.from('WorkoutSession').delete().eq('workoutId', params.id)

      for (const sess of sessionsData) {
        const { data: newSess, error: sessErr } = await supabaseAdmin
          .from('WorkoutSession')
          .insert({ workoutId: params.id, name: sess.name, order: sess.order, warmup: sess.warmup || null })
          .select()
          .single()
        if (sessErr) throw sessErr

        if (sess.exercises && sess.exercises.length > 0) {
          const exercises = sess.exercises.map((ex: Record<string, unknown>, idx: number) => ({
            sessionId: (newSess as Record<string, unknown>).id,
            exerciseId: ex.exerciseId || null,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rest: ex.rest || 60,
            notes: ex.notes || null,
            muscleGroup: ex.muscleGroup || null,
            videoUrl: ex.videoUrl || null,
            order: ex.order ?? idx + 1,
          }))
          await supabaseAdmin.from('WorkoutExercise').insert(exercises)
        }
      }
    }

    // Return updated workout
    const { data: updated } = await supabaseAdmin
      .from('Workout')
      .select('*, Student(*)')
      .eq('id', params.id)
      .single()
    return NextResponse.json(updated)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { error } = await supabaseAdmin.from('Workout').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
