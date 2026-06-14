export function errorMessage(err: unknown) {
  if (err instanceof Error) return err.message

  if (err && typeof err === 'object') {
    const maybe = err as {
      message?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
      error?: unknown
    }
    const parts = [maybe.error, maybe.message, maybe.details, maybe.hint, maybe.code]
      .filter(Boolean)
      .map(String)

    if (parts.length > 0) return parts.join(' ')
    return JSON.stringify(err)
  }

  return String(err)
}
