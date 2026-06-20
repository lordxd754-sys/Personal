export const MIN_PASSWORD_LENGTH = 10
export const MAX_AUTH_FIELD_LENGTH = 254

export interface RegistrationInput {
  name: string
  email: string
  password: string
}

export interface RegistrationValidationResult {
  ok: boolean
  error?: string
  value?: RegistrationInput
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string) {
  if (email.length > MAX_AUTH_FIELD_LENGTH) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (password.length > 128) {
    return 'Senha deve ter no máximo 128 caracteres.'
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Senha deve conter letras e números.'
  }
  return null
}

export function validateRegistrationInput(input: Record<string, unknown>): RegistrationValidationResult {
  const { name, email, password } = input

  if (typeof name !== 'string') {
    return { ok: false, error: 'Nome inválido.' }
  }

  const cleanName = name.trim().replace(/\s+/g, ' ')
  if (cleanName.length < 2) {
    return { ok: false, error: 'Nome deve ter ao menos 2 caracteres.' }
  }
  if (cleanName.length > 120) {
    return { ok: false, error: 'Nome deve ter no máximo 120 caracteres.' }
  }

  if (typeof email !== 'string') {
    return { ok: false, error: 'E-mail inválido.' }
  }

  const cleanEmail = normalizeEmail(email)
  if (!isValidEmail(cleanEmail)) {
    return { ok: false, error: 'E-mail inválido.' }
  }

  if (typeof password !== 'string') {
    return { ok: false, error: 'Senha inválida.' }
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    return { ok: false, error: passwordError }
  }

  return {
    ok: true,
    value: {
      name: cleanName,
      email: cleanEmail,
      password,
    },
  }
}

export function isSafeRedirectPath(path: string | null | undefined) {
  if (!path) return false
  if (/[\\\u0000-\u001f\u007f]/.test(path)) return false
  if (/%2f|%5c/i.test(path)) return false
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  if (path.startsWith('/api/')) return false
  if (path === '/login' || path === '/register') return false
  return true
}
