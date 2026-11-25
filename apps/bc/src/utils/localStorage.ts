export const readStoredStringArray = (key: string): string[] | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const stored = localStorage.getItem(key)
  if (stored === null) {
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stored)
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error
    }
    console.error('readStoredStringArray: invalid JSON', { key })
    localStorage.removeItem(key)
    return null
  }

  if (!Array.isArray(parsed) || !parsed.every((value): value is string => typeof value === 'string')) {
    console.error('readStoredStringArray: expected a string array', { key })
    localStorage.removeItem(key)
    return null
  }

  return parsed
}
