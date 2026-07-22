export const formatNumber = (value?: number, dec = 0) =>
  (value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: dec })

export const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export const safePercent = (part: number, total: number): number => {
  if (total <= 0) {
    return 0
  }

  return Math.round((part / total) * 100)
}

export const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export const average = (values: number[], decimals = 0): number => {
  if (values.length === 0) {
    return 0
  }

  const factor = 10 ** decimals
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * factor) / factor
}
