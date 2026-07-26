import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateAssessment } from '@/lib/assessment'
import { calculateBMI } from '@/lib/utils'
import { sanitizeNumber, sanitizeString } from '@/lib/sanitize'

function missingSchemaColumn(message: string) {
  const quotedColumn = message.match(/'([^']+)'\s+column/i)
  if (quotedColumn?.[1]) return quotedColumn[1]

  const columnDoesNotExist = message.match(/column\s+"?([A-Za-z0-9_]+)"?\s+(?:of\s+relation\s+"?PhysicalAssessment"?\s+)?does not exist/i)
  if (columnDoesNotExist?.[1]) return columnDoesNotExist[1]

  return null
}

async function updateAssessment(id: string, updateData: Record<string, unknown>) {
  const skippedColumns: string[] = []
  const dataToSave = { ...updateData }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from('PhysicalAssessment')
      .update(dataToSave)
      .eq('id', id)
      .select()
      .single()

    if (!error) {
      return { data, skippedColumns }
    }

    const message = String(error.message || error)
    const missingColumn = missingSchemaColumn(message)
    if (!missingColumn || !(missingColumn in dataToSave)) {
      throw new Error('Erro ao atualizar avaliação')
    }

    delete dataToSave[missingColumn]
    skippedColumns.push(missingColumn)
  }

  throw new Error('Schema do Supabase desatualizado')
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { data, error } = await supabaseAdmin
      .from('PhysicalAssessment')
      .select('*')
      .eq('id', params.id)
      .single()
    if (error) return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = await request.json()
    const weight = sanitizeNumber(body.weight, 0, 500)
    const height = sanitizeNumber(body.height, 0, 300)
    const age = sanitizeNumber(body.age, 0, 150)

    const sanitizeDobra = (v: unknown) => sanitizeNumber(v, 0, 100)

    const allDobras =
      sanitizeDobra(body.triceps) != null && sanitizeDobra(body.subscapular) != null && sanitizeDobra(body.pectoral) != null &&
      sanitizeDobra(body.midaxillary) != null && sanitizeDobra(body.suprailiac) != null && sanitizeDobra(body.abdominal) != null &&
      sanitizeDobra(body.thigh) != null

    let bodyFatPercent = null
    let leanMassKg = null
    let fatMassKg = null
    let classification = null

    if (allDobras && weight && height && age) {
      const result = calculateAssessment({
        weight, height, age,
        triceps: sanitizeDobra(body.triceps)!,
        subscapular: sanitizeDobra(body.subscapular)!,
        pectoral: sanitizeDobra(body.pectoral)!,
        midaxillary: sanitizeDobra(body.midaxillary)!,
        suprailiac: sanitizeDobra(body.suprailiac)!,
        abdominal: sanitizeDobra(body.abdominal)!,
        thigh: sanitizeDobra(body.thigh)!,
      })
      bodyFatPercent = result.bodyFatPercent
      leanMassKg = result.leanMassKg
      fatMassKg = result.fatMassKg
      classification = result.classification
    }

    const bmi = weight && weight > 0 && height && height > 0
      ? Math.round(calculateBMI(weight, height) * 10) / 10
      : null

    const updateData = {
      weight, height, age,
      triceps: sanitizeDobra(body.triceps),
      subscapular: sanitizeDobra(body.subscapular),
      pectoral: sanitizeDobra(body.pectoral),
      midaxillary: sanitizeDobra(body.midaxillary),
      suprailiac: sanitizeDobra(body.suprailiac),
      abdominal: sanitizeDobra(body.abdominal),
      thigh: sanitizeDobra(body.thigh),
      bodyFatPercent, leanMassKg, fatMassKg, bmi, classification,
      waistCm: sanitizeNumber(body.waistCm, 0, 300),
      hipCm: sanitizeNumber(body.hipCm, 0, 300),
      chestCm: sanitizeNumber(body.chestCm, 0, 300),
      abdomenCm: sanitizeNumber(body.abdomenCm, 0, 300),
      armRightCm: sanitizeNumber(body.armRightCm, 0, 100),
      armLeftCm: sanitizeNumber(body.armLeftCm, 0, 100),
      thighRightCm: sanitizeNumber(body.thighRightCm, 0, 200),
      thighLeftCm: sanitizeNumber(body.thighLeftCm, 0, 200),
      calfRightCm: sanitizeNumber(body.calfRightCm, 0, 100),
      calfLeftCm: sanitizeNumber(body.calfLeftCm, 0, 100),
      notes: sanitizeString(body.notes, 2000),
      assessedAt: body.assessedAt || new Date().toISOString(),
    }

    const { data, skippedColumns } = await updateAssessment(params.id, updateData)
    return NextResponse.json({
      ...data,
      skippedColumns,
      warning: skippedColumns.length > 0
        ? `Campos não gravados: ${skippedColumns.join(', ')}. Aplique a migration 003_assessment_circumferences.sql.`
        : null,
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar avaliação' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { error } = await supabaseAdmin.from('PhysicalAssessment').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: 'Erro ao excluir avaliação' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
