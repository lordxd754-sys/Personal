import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { daysSince } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data: students } = await supabaseAdmin
      .from('Student')
      .select('id, name, goal, level, status, lastContactAt')
      .eq('status', 'ativo')
    const allStudents = (students || []) as Array<Record<string, unknown>>

    const studentIds = allStudents.map((s) => s.id as string)
    let studentsWithoutAssessment: string[] = []
    if (studentIds.length > 0) {
      const { data: assessments } = await supabaseAdmin
        .from('PhysicalAssessment')
        .select('studentId')
        .in('studentId', studentIds)
      const assessedIds = new Set((assessments || []).map((a) => (a as Record<string, unknown>).studentId as string))
      studentsWithoutAssessment = studentIds.filter((id) => !assessedIds.has(id))
    }

    let studentsWithoutWorkout: string[] = []
    if (studentIds.length > 0) {
      const { data: workouts } = await supabaseAdmin
        .from('Workout')
        .select('studentId')
        .in('studentId', studentIds)
        .in('status', ['aprovado', 'enviado_mfit'])
      const workoutStudentIds = new Set((workouts || []).map((w) => (w as Record<string, unknown>).studentId as string))
      studentsWithoutWorkout = studentIds.filter((id) => !workoutStudentIds.has(id))
    }

    const overdueStudents = allStudents.filter((s) => daysSince(s.lastContactAt as string | null) > 15)
    const urgentStudents = allStudents
      .map((s) => ({ ...s, daysSinceContact: daysSince(s.lastContactAt as string | null) }))
      .filter((s) => s.daysSinceContact > 10)
      .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
      .slice(0, 10)

    const { data: recentExecutions } = await supabaseAdmin
      .from('WorkoutExecution')
      .select('*, Student(name), Workout(title), WorkoutSession(name)')
      .order('startedAt', { ascending: false })
      .limit(5)

    const { data: recentFollowUps } = await supabaseAdmin
      .from('FollowUp')
      .select('*, Student(name)')
      .order('sentAt', { ascending: false })
      .limit(5)

    const { data: recentAssessments } = await supabaseAdmin
      .from('PhysicalAssessment')
      .select('*, Student(name)')
      .order('assessedAt', { ascending: false })
      .limit(5)

    return NextResponse.json({
      metrics: {
        totalActive: allStudents.length,
        withoutAssessment: studentsWithoutAssessment.length,
        overdueFollowUp: overdueStudents.length,
        withoutWorkout: studentsWithoutWorkout.length,
      },
      urgentStudents,
      recentActivity: {
        executions: recentExecutions || [],
        followUps: recentFollowUps || [],
        assessments: recentAssessments || [],
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
