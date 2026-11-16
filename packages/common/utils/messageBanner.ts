const dismissalPeriod = 24 * 60 * 60 * 1000

export const getMessageBannerDismissalTimeRemaining = (dismissedAt: number, now: number = Date.now()) =>
  Math.max(0, dismissalPeriod - (now - dismissedAt))
