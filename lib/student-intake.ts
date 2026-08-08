import { NextRequest } from 'next/server'

type IntakeValue = string | number | boolean | null | IntakeValue[] | { [key: string]: IntakeValue }

export type StudentIntakePayload = {
  name: string
  email: string | null
  phone: string | null
  birthdate: string | null
  age: number | null
  height: number | null
  city: string | null
  state: string | null
  goal: string | null
  level: 'iniciante' | 'intermediario' | 'avancado'
  daysPerWeek: number
  sessionDuration: number
  restrictions: string | null
  equipment: string | null
  notes: string | null
  status: 'ativo' | 'pausado' | 'inativo'
  mfitId: string | null
  intakeFields?: string[]
}

type IntakeEntry = {
  key: string
  label: string
  value: string
}

const FIELD_ALIASES = {
  name: ['nome', 'nome completo', 'aluno', 'cliente', 'name', 'full name', 'full_name'],
  email: ['email', 'e-mail', 'mail'],
  phone: ['telefone', 'celular', 'whatsapp', 'phone', 'mobile'],
  birthdate: ['data de nascimento', 'data nascimento', 'data nasc', 'nascimento', 'birthdate', 'birth date', 'birthday', 'date of birth', 'dob'],
  age: ['idade', 'idade do aluno', 'age', 'quantos anos'],
  height: ['altura', 'altura do aluno', 'altura em cm', 'height', 'estatura', 'altura cm', 'altura (cm)'],
  city: ['cidade', 'city', 'municipio', 'município', 'localidade', 'endereco cidade', 'endereço cidade'],
  state: ['estado', 'uf', 'state', 'provincia', 'província', 'endereco estado', 'endereço estado'],
  cityState: ['cidade estado', 'cidade uf', 'cidade / estado', 'cidade/estado', 'city state'],
  goal: ['objetivo', 'meta', 'goal', 'objetivo principal'],
  level: ['nivel', 'nível', 'experiencia', 'experiência', 'level'],
  daysPerWeek: ['dias por semana', 'frequencia semanal', 'frequência semanal', 'days per week'],
  sessionDuration: ['duracao', 'duração', 'tempo de treino', 'session duration'],
  restrictions: ['restricao', 'restrição', 'restricoes', 'restrições', 'lesao', 'lesão', 'doenca', 'doença', 'medical', 'injury'],
  equipment: ['equipamento', 'equipamentos', 'academia', 'equipment'],
  notes: ['observacao', 'observação', 'observacoes', 'observações', 'comentario', 'comentário', 'notes'],
  mfitId: ['mfit', 'id mfit'],
}

function structuredDate(value: Record<string, unknown>) {
  const year = cleanText(value.year || value.ano)
  const month = cleanText(value.month || value.mes || value.mês)
  const day = cleanText(value.day || value.dia)
  if (!year || !month || !day) return ''
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function cleanText(value: unknown) {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const date = structuredDate(record)
    if (date) return date
    if (record.full) return cleanText(record.full)
    return Object.values(record).map(cleanText).filter(Boolean).join(' ')
  }
  return String(value).trim()
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function titleFromKey(key: string) {
  return key
    .replace(/^q\d+_?/i, '')
    .replace(/[_[\].-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || key
}

function titleFromNestedKey(key: string) {
  const labels: Record<string, string> = {
    addr_line1: 'Endereço',
    addr_line2: 'Complemento',
    city: 'Cidade',
    state: 'Estado',
    postal: 'CEP',
    postal_code: 'CEP',
    zip: 'CEP',
    country: 'País',
    day: 'Dia',
    month: 'Mês',
    year: 'Ano',
    first: 'Nome',
    last: 'Sobrenome',
    full: 'Completo',
  }
  return labels[key] || titleFromKey(key)
}

function addEntry(entries: IntakeEntry[], key: string, label: string, value: unknown) {
  const text = cleanText(value)
  if (!text) return
  entries.push({ key, label: label || titleFromKey(key), value: text })
}

function addNestedEntries(entries: IntakeEntry[], baseKey: string, baseLabel: string, value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return

  Object.entries(value as Record<string, unknown>).forEach(([key, rawValue]) => {
    if (rawValue == null || rawValue === '') return
    const childKey = `${baseKey}.${key}`
    const childLabel = `${baseLabel} ${titleFromNestedKey(key)}`.trim()
    addEntry(entries, childKey, childLabel, rawValue)

    if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
      addNestedEntries(entries, childKey, childLabel, rawValue)
    }
  })
}

function collectEntries(input: unknown, entries: IntakeEntry[], prefix = '') {
  if (!input || typeof input !== 'object') return
  Object.entries(input as Record<string, unknown>).forEach(([key, rawValue]) => {
    const currentKey = prefix ? `${prefix}.${key}` : key
    if (key === 'rawRequest' && typeof rawValue === 'string') {
      try {
        collectEntries(JSON.parse(rawValue), entries, 'rawRequest')
      } catch {
        addEntry(entries, currentKey, 'rawRequest', rawValue)
      }
      return
    }

    if (key === 'answers' && rawValue && typeof rawValue === 'object') {
      Object.entries(rawValue as Record<string, any>).forEach(([answerKey, answer]) => {
        if (answer && typeof answer === 'object') {
          const label = cleanText(answer.text) || cleanText(answer.name) || titleFromKey(answerKey)
          const value = answer.answer ?? answer.prettyFormat ?? answer
          addEntry(entries, answerKey, label, value)
          addNestedEntries(entries, answerKey, label, value)
        } else {
          addEntry(entries, answerKey, titleFromKey(answerKey), answer)
        }
      })
      return
    }

    if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
      const maybeQuestion = rawValue as Record<string, unknown>
      if ('answer' in maybeQuestion || 'prettyFormat' in maybeQuestion) {
        const label = cleanText(maybeQuestion.text) || cleanText(maybeQuestion.name) || titleFromKey(key)
        const value = maybeQuestion.answer ?? maybeQuestion.prettyFormat
        addEntry(entries, currentKey, label, value)
        addNestedEntries(entries, currentKey, label, value)
        return
      }
    }

    addEntry(entries, currentKey, titleFromKey(key), rawValue)
    addNestedEntries(entries, currentKey, titleFromKey(key), rawValue)
  })
}

function parsePretty(pretty: string, entries: IntakeEntry[]) {
  pretty
    .split(/\r?\n|<br\s*\/?>/i)
    .map(line => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const separator = line.includes(':') ? ':' : line.includes('=') ? '=' : null
      if (!separator) return
      const [label, ...rest] = line.split(separator)
      addEntry(entries, `pretty.${index}`, label, rest.join(separator))
    })
}

function firstByAliases(entries: IntakeEntry[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalize)
  const exact = entries.find(entry => {
    const candidates = [entry.label, entry.key].map(normalize)
    return candidates.some(candidate => normalizedAliases.includes(candidate))
  })
  if (exact) return exact.value

  const partial = entries.find(entry => {
    const candidates = [entry.label, entry.key].map(normalize)
    return candidates.some(candidate => normalizedAliases.some(alias => candidate.includes(alias)))
  })
  return partial?.value || ''
}

function normalizeDate(value: string) {
  if (!value) return null
  const iso = value.match(/\d{4}-\d{2}-\d{2}/)?.[0]
  if (iso) return iso
  const br = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)
  const spaced = value.match(/\b(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})\b/)
  const parts = br || spaced
  if (!parts) return null
  const day = parts[1].padStart(2, '0')
  const month = parts[2].padStart(2, '0')
  const year = parts[3].length === 2 ? `20${parts[3]}` : parts[3]
  return `${year}-${month}-${day}`
}

function calculateAgeFromBirthdate(birthdate: string | null) {
  if (!birthdate) return null
  const [year, month, day] = birthdate.split('-').map(Number)
  if (!year || !month || !day) return null
  const today = new Date()
  let age = today.getFullYear() - year
  const hadBirthday = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day)
  if (!hadBirthday) age -= 1
  return age >= 0 && age <= 130 ? age : null
}

function normalizeLevel(value: string): StudentIntakePayload['level'] {
  const normalized = normalize(value)
  if (normalized.includes('avanc')) return 'avancado'
  if (normalized.includes('inter')) return 'intermediario'
  return 'iniciante'
}

function numberInRange(value: string, fallback: number, min: number, max: number) {
  const number = Number.parseInt(value.match(/\d+/)?.[0] || '', 10)
  if (!Number.isFinite(number)) return fallback
  return Math.min(Math.max(number, min), max)
}

function optionalNumberInRange(value: string, min: number, max: number) {
  if (!value) return null
  const normalized = value.replace(',', '.')
  const number = Number.parseFloat(normalized.match(/\d+(?:\.\d+)?/)?.[0] || '')
  if (!Number.isFinite(number)) return null
  return Math.min(Math.max(number, min), max)
}

function optionalHeightInCm(value: string) {
  const height = optionalNumberInRange(value, 0, 300)
  if (height == null) return null
  if (height > 0 && height <= 3) return Math.round(height * 100)
  return height
}

function splitCityState(value: string) {
  if (!value) return { city: '', state: '' }
  const normalizedValue = value.replace(/\s+/g, ' ').trim()
  const separated = normalizedValue.match(/^(.+?)\s*(?:\/|-|,)\s*([A-Za-zÀ-ÿ]{2,})$/)
  if (separated) return { city: separated[1].trim(), state: separated[2].trim() }

  const endingUf = normalizedValue.match(/^(.+?)\s+([A-Za-z]{2})$/)
  if (endingUf) return { city: endingUf[1].trim(), state: endingUf[2].trim() }

  return { city: normalizedValue, state: '' }
}

function normalizeState(value: string) {
  if (!value) return null
  const stateNames: Record<string, string> = {
    acre: 'AC',
    alagoas: 'AL',
    amapa: 'AP',
    amazonas: 'AM',
    bahia: 'BA',
    ceara: 'CE',
    'distrito federal': 'DF',
    'espirito santo': 'ES',
    goias: 'GO',
    maranhao: 'MA',
    'mato grosso': 'MT',
    'mato grosso do sul': 'MS',
    'minas gerais': 'MG',
    para: 'PA',
    paraiba: 'PB',
    parana: 'PR',
    pernambuco: 'PE',
    piaui: 'PI',
    'rio de janeiro': 'RJ',
    'rio grande do norte': 'RN',
    'rio grande do sul': 'RS',
    rondonia: 'RO',
    roraima: 'RR',
    'santa catarina': 'SC',
    'sao paulo': 'SP',
    sergipe: 'SE',
    tocantins: 'TO',
  }
  const split = splitCityState(value)
  const candidate = split.state || value
  const normalized = normalize(candidate)
  if (stateNames[normalized]) return stateNames[normalized]
  const uf = candidate.match(/\b([A-Za-z]{2})\b/)?.[1]
  return uf ? uf.toUpperCase() : candidate.slice(0, 2).toUpperCase()
}

function buildFullNotes(entries: IntakeEntry[], baseNotes: string | null) {
  const ignored = new Set(['rawRequest'])
  const lines = entries
    .filter(entry => !ignored.has(entry.key))
    .map(entry => `${entry.label}: ${entry.value}`)

  const uniqueLines = Array.from(new Set(lines))
  const sections = [
    baseNotes ? `Observações do aluno:\n${baseNotes}` : '',
    uniqueLines.length > 0 ? `Dados completos do formulário:\n${uniqueLines.join('\n')}` : '',
  ].filter(Boolean)

  return sections.join('\n\n') || null
}

export async function readStudentIntakeRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return request.json()
  }

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    return Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, typeof value === 'string' ? value : value.name]))
  }

  const text = await request.text()
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(text).entries())
  }

  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

export function normalizeStudentIntake(input: Record<string, IntakeValue>): StudentIntakePayload {
  const entries: IntakeEntry[] = []
  collectEntries(input, entries)
  if (typeof input.pretty === 'string') parsePretty(input.pretty, entries)

  const name = firstByAliases(entries, FIELD_ALIASES.name) || firstByAliases(entries, ['first name', 'nome primeiro'])
  const email = firstByAliases(entries, FIELD_ALIASES.email) || null
  const phone = firstByAliases(entries, FIELD_ALIASES.phone) || null
  const birthdate = normalizeDate(firstByAliases(entries, FIELD_ALIASES.birthdate))
  const ageRaw = firstByAliases(entries, FIELD_ALIASES.age)
  const heightRaw = firstByAliases(entries, FIELD_ALIASES.height)
  const cityRaw = firstByAliases(entries, FIELD_ALIASES.city)
  const stateRaw = firstByAliases(entries, FIELD_ALIASES.state)
  const cityStateRaw = firstByAliases(entries, FIELD_ALIASES.cityState)
  const combinedLocation = cityStateRaw || (cityRaw && stateRaw && cityRaw === stateRaw ? cityRaw : '')
  const splitLocation = splitCityState(combinedLocation)
  const city = splitLocation.city || cityRaw || null
  const state = normalizeState(splitLocation.state || stateRaw)
  const goal = firstByAliases(entries, FIELD_ALIASES.goal) || null
  const levelRaw = firstByAliases(entries, FIELD_ALIASES.level)
  const daysPerWeekRaw = firstByAliases(entries, FIELD_ALIASES.daysPerWeek)
  const sessionDurationRaw = firstByAliases(entries, FIELD_ALIASES.sessionDuration)
  const restrictions = firstByAliases(entries, FIELD_ALIASES.restrictions) || null
  const equipment = firstByAliases(entries, FIELD_ALIASES.equipment) || null
  const notes = firstByAliases(entries, FIELD_ALIASES.notes) || null
  const mfitId = firstByAliases(entries, FIELD_ALIASES.mfitId) || null
  const intakeFields = Object.entries({
    name,
    email,
    phone,
    birthdate,
    age: ageRaw,
    height: heightRaw,
    city,
    state,
    goal,
    level: levelRaw,
    daysPerWeek: daysPerWeekRaw,
    sessionDuration: sessionDurationRaw,
    restrictions,
    equipment,
    notes,
    mfitId,
  })
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key)

  return {
    name: name || email || phone || 'Aluno sem nome',
    email,
    phone,
    birthdate,
    age: optionalNumberInRange(ageRaw, 0, 130) ?? calculateAgeFromBirthdate(birthdate),
    height: optionalHeightInCm(heightRaw),
    city,
    state,
    goal,
    level: normalizeLevel(levelRaw),
    daysPerWeek: numberInRange(daysPerWeekRaw, 3, 1, 7),
    sessionDuration: numberInRange(sessionDurationRaw, 60, 15, 180),
    restrictions,
    equipment,
    notes: buildFullNotes(entries, notes),
    status: 'ativo',
    mfitId,
    intakeFields,
  }
}
