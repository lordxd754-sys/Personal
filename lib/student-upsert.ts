import { supabaseAdmin } from '@/lib/supabase'
import type { StudentIntakePayload } from '@/lib/student-intake'
import { mergeStudentProfileNotes } from '@/lib/student-profile-notes'

const FORM_NOTES_MARKER = 'Dados completos do formulário:'

type ExistingStudent = {
  id: string
  notes: string | null
}

type StudentUpsertResult = {
  student: unknown
  action: 'created' | 'updated'
}

function isMissingAgeHeightColumn(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const err = error as { code?: string; message?: string }
  return (
    err.code === 'PGRST204' &&
    Boolean(err.message?.includes('age') || err.message?.includes('height'))
  )
}

function withoutAgeHeight(payload: Record<string, unknown>) {
  const { age, height, notes, ...rest } = payload
  return {
    ...rest,
    notes: mergeStudentProfileNotes(typeof notes === 'string' ? notes : null, { age: age as number | null, height: height as number | null }),
  }
}

function compactStudentPayload(
  payload: StudentIntakePayload,
  options: { omitNulls?: boolean; onlyFields?: Set<string> } = {}
) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (key === 'intakeFields') return false
      if (options.onlyFields && !options.onlyFields.has(key)) return false
      if (value === undefined || value === '') return false
      if (options.omitNulls && value === null) return false
      return true
    })
  )
}

function splitFormNotes(notes: string | null | undefined) {
  if (!notes) return { regular: '', form: '' }
  const markerIndex = notes.indexOf(FORM_NOTES_MARKER)
  if (markerIndex === -1) return { regular: notes.trim(), form: '' }

  return {
    regular: notes.slice(0, markerIndex).replace(/^Observações do aluno:\s*/i, '').trim(),
    form: notes.slice(markerIndex).trim(),
  }
}

function mergeNotes(existing: string | null, incoming: string | null) {
  if (!existing) return incoming
  if (!incoming) return existing
  if (existing === incoming) return existing

  const existingParts = splitFormNotes(existing)
  const incomingParts = splitFormNotes(incoming)

  if (!incomingParts.form) return incoming

  const regular = incomingParts.regular || existingParts.regular
  return [regular ? `Observações do aluno:\n${regular}` : '', incomingParts.form]
    .filter(Boolean)
    .join('\n\n')
}

async function findExistingStudent(payload: StudentIntakePayload) {
  const fields: Array<['email' | 'phone', string | null]> = [
    ['email', payload.email],
    ['phone', payload.phone],
  ]

  for (const [field, value] of fields) {
    if (!value) continue
    const { data, error } = await supabaseAdmin
      .from('Student')
      .select('id, notes')
      .eq(field, value)
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (data) return data as ExistingStudent
  }

  return null
}

export async function upsertStudentFromIntake(payload: StudentIntakePayload): Promise<StudentUpsertResult> {
  const now = new Date().toISOString()
  const existing = await findExistingStudent(payload)

  if (existing) {
    const fieldsToUpdate = new Set(payload.intakeFields || [])
    fieldsToUpdate.add('notes')

    const updatePayload = compactStudentPayload({
      ...payload,
      notes: mergeNotes(existing.notes, payload.notes),
    }, { omitNulls: true, onlyFields: fieldsToUpdate })

    const { data, error } = await supabaseAdmin
      .from('Student')
      .update({ ...updatePayload, updatedAt: now })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      if (!isMissingAgeHeightColumn(error)) throw error
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('Student')
        .update({ ...withoutAgeHeight(updatePayload), updatedAt: now })
        .eq('id', existing.id)
        .select()
        .single()
      if (fallbackError) throw fallbackError
      return { student: fallbackData, action: 'updated' }
    }
    return { student: data, action: 'updated' }
  }

  const insertPayload = compactStudentPayload(payload)
  const { data, error } = await supabaseAdmin
    .from('Student')
    .insert({ ...insertPayload, createdAt: now, updatedAt: now })
    .select()
    .single()

  if (error) {
    if (!isMissingAgeHeightColumn(error)) throw error
    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
      .from('Student')
      .insert({ ...withoutAgeHeight(insertPayload), createdAt: now, updatedAt: now })
      .select()
      .single()
    if (fallbackError) throw fallbackError
    return { student: fallbackData, action: 'created' }
  }
  return { student: data, action: 'created' }
}
