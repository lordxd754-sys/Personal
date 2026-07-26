/**
 * Sanitize user input for database operations.
 * Only allows whitelisted columns to be passed to insert/update.
 */

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj && obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }
  return result
}

export function sanitizeString(value: unknown, maxLength = 1000): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  return trimmed.slice(0, maxLength)
}

export function sanitizeNumber(value: unknown, min?: number, max?: number): number | null {
  const num = Number(value)
  if (isNaN(num) || !isFinite(num)) return null
  if (min !== undefined && num < min) return null
  if (max !== undefined && num > max) return null
  return num
}

export function sanitizeBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[%_\\]/g, '\\$&')
    .trim()
    .slice(0, 100)
}
