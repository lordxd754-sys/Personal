import { supabaseAdmin } from '@/lib/supabase'
import type { StudentIntakePayload } from '@/lib/student-intake'

const FORM_NOTES_MARKER = 'Dados completos do formulário:'

type ExistingStudent = {
  id: string
  notes: string | null
}

type StudentUpsertResult = {
  student: unknown
  action: 'created' | 'updated'
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

    if (error) throw error
    return { student: data, action: 'updated' }
  }

  const { data, error } = await supabaseAdmin
    .from('Student')
    .insert({ ...compactStudentPayload(payload), createdAt: now, updatedAt: now })
    .select()
    .single()

  if (error) throw error
  return { student: data, action: 'created' }
}
