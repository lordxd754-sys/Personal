import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateAssessment } from '@/lib/assessment'
import { calculateBMI } from '@/lib/utils'
import { errorMessage } from '@/lib/error-message'

function missingSchemaColumn(message: string) {
  const quotedColumn = message.match(/'([^']+)'\s+column/i)
  if (quotedColumn?.[1]) return quotedColumn[1]

  const columnDoesNotExist = message.match(/column\s+"?([A-Za-z0-9_]+)"?\s+(?:of\s+relation\s+"?PhysicalAssessment"?\s+)?does not exist/i)
  if (columnDoesNotExist?.[1]) return columnDoesNotExist[1]

  return null
}

async function createAssessment(insertData: Record<string, unknown>) {
  const skippedColumns: string[] = []
  const dataToSave = { ...insertData }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from('PhysicalAssessment')
      .insert(dataToSave)
      .select()
      .single()

    if (!error) {
      return { data, skippedColumns }
    }

    const message = errorMessage(error)
    const missingColumn = missingSchemaColumn(message)
    if (!missingColumn || !(missingColumn in dataToSave)) {
      throw error
    }

    delete dataToSave[missingColumn]
    skippedColumns.push(missingColumn)
  }

  throw new Error('Não foi possível salvar a avaliação porque o schema do Supabase está desatualizado.')
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
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
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
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

    const insertData = {
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
      abdomenCm: body.abdomenCm ?? null,
      armCm: body.armRightCm ?? null,
      thighCm: body.thighRightCm ?? null,
      calfCm: body.calfRightCm ?? null,
      armRightCm: body.armRightCm ?? null,
      armLeftCm: body.armLeftCm ?? null,
      thighRightCm: body.thighRightCm ?? null,
      thighLeftCm: body.thighLeftCm ?? null,
      calfRightCm: body.calfRightCm ?? null,
      calfLeftCm: body.calfLeftCm ?? null,
      notes: body.notes ?? null,
      assessedAt: body.assessedAt || new Date().toISOString(),
    }

    const { data, skippedColumns } = await createAssessment(insertData)
    return NextResponse.json({
      ...data,
      skippedColumns,
      warning: skippedColumns.length > 0
        ? `Avaliação salva, mas estes campos ainda não existem no Supabase e não foram gravados: ${skippedColumns.join(', ')}. Aplique a migration supabase/migrations/003_assessment_circumferences.sql para salvar todas as circunferências.`
        : null,
    }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 })
  }
}
