import {
  getMessageBannerDismissalTimeRemaining,
  getMessageBannerExpirationDelay,
  readMessageBannerDismissal,
  startMessageBannerRefresh,
  writeMessageBannerDismissal,
} from '@abc-transitionbascarbone/common/utils/messageBanner'
import { DAY, TIME_IN_MS } from '@abc-transitionbascarbone/common/utils/time'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

it.each([
  { label: 'less than 24 hours', elapsed: DAY * TIME_IN_MS - 1, expected: 1 },
  { label: 'exactly 24 hours', elapsed: DAY * TIME_IN_MS, expected: 0 },
  { label: 'more than 24 hours', elapsed: DAY * TIME_IN_MS + 1, expected: 0 },
])('returns the remaining dismissal period at $label', ({ elapsed, expected }) => {
  expect(getMessageBannerDismissalTimeRemaining(0, elapsed)).toBe(expected)
})

it.each([
  { expiresAt: 999, now: 1000, expected: null },
  { expiresAt: 1000, now: 1000, expected: 1 },
  { expiresAt: 2000, now: 1000, expected: 1001 },
  { expiresAt: 3_000_000_000, now: 1000, expected: 2_147_483_647 },
])('schedules expiration safely for $expiresAt at $now', ({ expiresAt, now, expected }) => {
  expect(getMessageBannerExpirationDelay(expiresAt, now)).toBe(expected)
})

it('stores, reads and clears a dismissal', () => {
  expect(readMessageBannerDismissal('banner')).toBeNull()
  writeMessageBannerDismissal('banner', 123)
  expect(readMessageBannerDismissal('banner')).toBe(123)
  writeMessageBannerDismissal('banner', null)
  expect(readMessageBannerDismissal('banner')).toBeNull()
})

it.each(['invalid', 'NaN', 'Infinity', '-1', '0'])('ignores invalid stored timestamp %s', (value) => {
  window.localStorage.setItem('banner', value)
  expect(readMessageBannerDismissal('banner')).toBeNull()
})

it('reports blocked storage without throwing', () => {
  jest.spyOn(console, 'error').mockImplementation()
  jest.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('Storage blocked', 'SecurityError')
  })

  expect(readMessageBannerDismissal('banner')).toBeNull()
  expect(() => writeMessageBannerDismissal('banner', 123)).not.toThrow()
  expect(() => writeMessageBannerDismissal('banner', null)).not.toThrow()
  expect(console.error).toHaveBeenCalledTimes(3)
})

it('reports a failed storage write or removal', () => {
  jest.spyOn(console, 'error').mockImplementation()
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError')
  })
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new DOMException('Storage blocked', 'SecurityError')
  })

  expect(() => writeMessageBannerDismissal('banner', 123)).not.toThrow()
  expect(() => writeMessageBannerDismissal('banner', null)).not.toThrow()
  expect(console.error).toHaveBeenCalledTimes(2)
})

it('refreshes visible tabs each minute and on focus, then cleans up', () => {
  jest.useFakeTimers()
  const visibility = jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  const refresh = jest.fn()
  const stop = startMessageBannerRefresh(refresh)

  jest.advanceTimersByTime(60_000)
  expect(refresh).toHaveBeenCalledTimes(1)
  window.dispatchEvent(new Event('focus'))
  expect(refresh).toHaveBeenCalledTimes(2)

  visibility.mockReturnValue('hidden')
  jest.advanceTimersByTime(60_000)
  window.dispatchEvent(new Event('focus'))
  expect(refresh).toHaveBeenCalledTimes(2)

  visibility.mockReturnValue('visible')
  document.dispatchEvent(new Event('visibilitychange'))
  expect(refresh).toHaveBeenCalledTimes(3)

  stop()
  jest.advanceTimersByTime(60_000)
  window.dispatchEvent(new Event('focus'))
  document.dispatchEvent(new Event('visibilitychange'))
  expect(refresh).toHaveBeenCalledTimes(3)
})
