import { NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { daysSince } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const [
      studentsResult,
      recentExecutionsResult,
      recentFollowUpsResult,
      recentAssessmentsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from('Student')
        .select('id, name, goal, level, status, lastContactAt')
        .eq('status', 'ativo'),
      supabaseAdmin
        .from('WorkoutExecution')
        .select('id, startedAt, finishedAt, duration, Student(name), Workout(title), WorkoutSession(name)')
        .order('startedAt', { ascending: false })
        .limit(5),
      supabaseAdmin
        .from('FollowUp')
        .select('id, sentAt, status, channel, Student(name)')
        .order('sentAt', { ascending: false })
        .limit(5),
      supabaseAdmin
        .from('PhysicalAssessment')
        .select('id, assessedAt, bodyFatPercent, bmi, Student(name)')
        .order('assessedAt', { ascending: false })
        .limit(5),
    ])

    if (studentsResult.error) throw studentsResult.error

    const students = studentsResult.data
    const allStudents = (students || []) as Array<Record<string, unknown>>

    const studentIds = allStudents.map((s) => s.id as string)
    const [assessmentsResult, workoutsResult] = studentIds.length > 0
      ? await Promise.all([
          supabaseAdmin
            .from('PhysicalAssessment')
            .select('studentId')
            .in('studentId', studentIds),
          supabaseAdmin
            .from('Workout')
            .select('studentId')
            .in('studentId', studentIds)
            .in('status', ['aprovado', 'enviado_mfit']),
        ])
      : [{ data: [] }, { data: [] }]

    const assessedIds = new Set(((assessmentsResult.data || []) as Array<Record<string, unknown>>).map((a) => a.studentId as string))
    const workoutStudentIds = new Set(((workoutsResult.data || []) as Array<Record<string, unknown>>).map((w) => w.studentId as string))
    const studentsWithoutAssessment = studentIds.filter((id) => !assessedIds.has(id))
    const studentsWithoutWorkout = studentIds.filter((id) => !workoutStudentIds.has(id))

    const overdueStudents = allStudents.filter((s) => daysSince(s.lastContactAt as string | null) > 15)
    const urgentStudents = allStudents
      .map((s) => ({ ...s, daysSinceContact: daysSince(s.lastContactAt as string | null) }))
      .filter((s) => s.daysSinceContact > 10)
      .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
      .slice(0, 10)

    return NextResponse.json({
      metrics: {
        totalActive: allStudents.length,
        withoutAssessment: studentsWithoutAssessment.length,
        overdueFollowUp: overdueStudents.length,
        withoutWorkout: studentsWithoutWorkout.length,
      },
      urgentStudents,
      recentActivity: {
        executions: recentExecutionsResult.data || [],
        followUps: recentFollowUpsResult.data || [],
        assessments: recentAssessmentsResult.data || [],
      },
    }, {
      headers: {
        'Cache-Control': 'private, max-age=20, stale-while-revalidate=60',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
