import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data: workout } = await supabaseAdmin
      .from('Workout')
      .select('*')
      .eq('id', params.id)
      .single()
    const { data: sessions } = await supabaseAdmin
      .from('WorkoutSession')
      .select('*, WorkoutExercise(*)')
      .eq('workoutId', params.id)
      .order('order', { ascending: true })

    const w = workout as Record<string, unknown>
    const title = w.title as string
    let text = `${title}\n${'='.repeat(title.length)}\n\n`

    const generalNotes =
      w.content ? (JSON.parse(w.content as string) as Record<string, unknown>).generalNotes : null
    if (generalNotes) text += `📋 Observações Gerais:\n${generalNotes}\n\n`

    for (const sess of (sessions || []) as Array<Record<string, unknown>>) {
      const sessName = sess.name as string
      text += `${sessName.toUpperCase()}\n${'-'.repeat(sessName.length)}\n`
      if (sess.warmup) text += `🔥 Aquecimento: ${sess.warmup}\n`
      text += '\n'
      const exercises = ((sess.WorkoutExercise as Array<Record<string, unknown>>) || []).sort(
        (a, b) => (a.order as number) - (b.order as number)
      )
      exercises.forEach((ex, idx) => {
        const rest = ex.rest ? `${ex.rest}s descanso` : ''
        text += `${idx + 1}. ${ex.name} | ${ex.sets}x${ex.reps}${rest ? ' | ' + rest : ''}\n`
        if (ex.notes) text += `   💡 ${ex.notes}\n`
      })
      text += '\n'
    }

    return new NextResponse(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
