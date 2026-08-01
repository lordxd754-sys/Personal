const PROFILE_NOTES_MARKER = 'Dados físicos do cadastro:'

type ProfileValues = {
  age?: number | string | null
  height?: number | string | null
}

function cleanNumber(value: number | string | null | undefined) {
  if (value == null || value === '') return null
  const number = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(',', '.'))
  return Number.isFinite(number) ? number : null
}

export function stripStudentProfileNotes(notes: string | null | undefined) {
  if (!notes) return ''
  const lines = notes.split('\n')
  const start = lines.findIndex((line) => line.trim() === PROFILE_NOTES_MARKER)
  if (start === -1) return notes.trim()

  let end = start + 1
  while (end < lines.length && lines[end].trim() && !lines[end].endsWith(':')) {
    end += 1
  }

  return [...lines.slice(0, start), ...lines.slice(end)].join('\n').trim()
}

export function mergeStudentProfileNotes(notes: string | null | undefined, values: ProfileValues) {
  const age = cleanNumber(values.age)
  const height = cleanNumber(values.height)
  const physicalLines = [
    age != null ? `Idade: ${age}` : '',
    height != null ? `Altura: ${height} cm` : '',
  ].filter(Boolean)

  if (physicalLines.length === 0) return notes || null

  const baseNotes = stripStudentProfileNotes(notes || '')
  return [`${PROFILE_NOTES_MARKER}\n${physicalLines.join('\n')}`, baseNotes]
    .filter(Boolean)
    .join('\n\n')
}

export function parseStudentProfileNotes(notes: string | null | undefined) {
  const text = notes || ''
  const age = text.match(/Idade:\s*(\d+(?:[,.]\d+)?)/i)?.[1]
  const height = text.match(/Altura:\s*(\d+(?:[,.]\d+)?)/i)?.[1]

  return {
    age: cleanNumber(age),
    height: cleanNumber(height),
  }
}
