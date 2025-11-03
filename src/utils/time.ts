export const SEC = 1
export const MIN = 60 * SEC
export const HOUR = 60 * MIN
export const DAY = 24 * HOUR
export const WEEK = 7 * DAY
export const MONTH = 30 * DAY
export const YEAR = 12 * MONTH

export const TIME_IN_MS = 1000

export const formatDateFr = (date: Date) => {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export const getYearFromDateStr = (date: string) => {
  return new Date(date).getFullYear()
}
