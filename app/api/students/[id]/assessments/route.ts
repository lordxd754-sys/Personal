import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateAssessment } from '@/lib/assessment'
import { calculateBMI } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await supabaseAdmin
      .from('PhysicalAssessment')
      .select('*')
      .eq('studentId', params.id)
      .order('assessedAt', { ascending: false })
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const { weight, height, age } = body

    const allDobras =
      body.triceps != null && body.subscapular != null && body.pectoral != null &&
      body.midaxillary != null && body.suprailiac != null && body.abdominal != null &&
      body.thigh != null

    let bodyFatPercent = null
    let leanMassKg = null
    let fatMassKg = null
    let classification = null

    if (allDobras) {
      const result = calculateAssessment({
        weight, height, age,
        triceps: body.triceps,
        subscapular: body.subscapular,
        pectoral: body.pectoral,
        midaxillary: body.midaxillary,
        suprailiac: body.suprailiac,
        abdominal: body.abdominal,
        thigh: body.thigh,
      })
      bodyFatPercent = result.bodyFatPercent
      leanMassKg = result.leanMassKg
      fatMassKg = result.fatMassKg
      classification = result.classification
    }

    const bmi = weight > 0 && height > 0
      ? Math.round(calculateBMI(weight, height) * 10) / 10
      : null

    const { data, error } = await supabaseAdmin
      .from('PhysicalAssessment')
      .insert({
        studentId: params.id,
        weight,
        height,
        age,
        triceps: body.triceps ?? null,
        subscapular: body.subscapular ?? null,
        pectoral: body.pectoral ?? null,
        midaxillary: body.midaxillary ?? null,
        suprailiac: body.suprailiac ?? null,
        abdominal: body.abdominal ?? null,
        thigh: body.thigh ?? null,
        bodyFatPercent,
        leanMassKg,
        fatMassKg,
        bmi,
        classification,
        waistCm: body.waistCm ?? null,
        hipCm: body.hipCm ?? null,
        chestCm: body.chestCm ?? null,
        armCm: body.armCm ?? null,
        thighCm: body.thighCm ?? null,
        calfCm: body.calfCm ?? null,
        notes: body.notes ?? null,
        assessedAt: body.assessedAt || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
