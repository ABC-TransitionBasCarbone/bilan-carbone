export const isYesValue = (value: unknown): boolean => {
  if (value === true) {
    return true
  }

  if (typeof value !== 'string') {
    return false
  }

  const normalized = value.trim().toLowerCase()
  return normalized === 'oui' || normalized === 'yes' || normalized === 'true'
}
