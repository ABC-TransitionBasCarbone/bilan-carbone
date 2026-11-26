import { DAY, TIME_IN_MS } from './time'

const MESSAGE_BANNER_DISMISSAL_PERIOD_MS = DAY * TIME_IN_MS

export const getMessageBannerDismissalTimeRemaining = (dismissedAt: number, now: number = Date.now()) =>
  Math.max(0, MESSAGE_BANNER_DISMISSAL_PERIOD_MS - (now - dismissedAt))

export const getMessageBannerExpirationDelay = (expiresAt: number, now: number = Date.now()) =>
  now > expiresAt ? null : Math.min(expiresAt - now + 1, 2_147_483_647)

export const readMessageBannerDismissal = (storageKey: string): number | null => {
  try {
    const stored = Number(window.localStorage.getItem(storageKey))
    return Number.isFinite(stored) && stored > 0 ? stored : null
  } catch (error) {
    console.error('readMessageBannerDismissal: localStorage unavailable', { storageKey, error })
    return null
  }
}

export const writeMessageBannerDismissal = (storageKey: string, dismissedAt: number | null) => {
  try {
    if (dismissedAt === null) {
      window.localStorage.removeItem(storageKey)
    } else {
      window.localStorage.setItem(storageKey, dismissedAt.toString())
    }
  } catch (error) {
    console.error('writeMessageBannerDismissal: localStorage unavailable', { storageKey, error })
  }
}

export const startMessageBannerRefresh = (refresh: () => void) => {
  const refreshIfVisible = () => {
    if (document.visibilityState === 'visible') {
      refresh()
    }
  }
  const interval = window.setInterval(refreshIfVisible, 60_000)
  window.addEventListener('focus', refreshIfVisible)
  document.addEventListener('visibilitychange', refreshIfVisible)

  return () => {
    window.clearInterval(interval)
    window.removeEventListener('focus', refreshIfVisible)
    document.removeEventListener('visibilitychange', refreshIfVisible)
  }
}
