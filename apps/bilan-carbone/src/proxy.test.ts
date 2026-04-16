jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createInMemoryRateLimiter, getPublicRouteScope } = require('@/proxy')

describe('createInMemoryRateLimiter', () => {
  it('allows requests up to the configured limit and blocks the next one', () => {
    const limiter = createInMemoryRateLimiter(3, 1000)
    const key = '198.51.100.1:/preview'

    expect(limiter.check(key, 1).isLimited).toBe(false)
    expect(limiter.check(key, 2).isLimited).toBe(false)
    expect(limiter.check(key, 3).isLimited).toBe(false)

    const blockedResult = limiter.check(key, 4)
    expect(blockedResult.isLimited).toBe(true)
    expect(blockedResult.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets the limiter window once the configured period has elapsed', () => {
    const limiter = createInMemoryRateLimiter(1, 1000)
    const key = '198.51.100.2:/login'

    expect(limiter.check(key, 1).isLimited).toBe(false)
    expect(limiter.check(key, 2).isLimited).toBe(true)
    expect(limiter.check(key, 1200).isLimited).toBe(false)
  })

  it('tracks counters independently per key', () => {
    const limiter = createInMemoryRateLimiter(1, 1000)
    const keyA = '198.51.100.3:/tilt/login'
    const keyB = '198.51.100.4:/tilt/login'

    expect(limiter.check(keyA, 1).isLimited).toBe(false)
    expect(limiter.check(keyA, 2).isLimited).toBe(true)
    expect(limiter.check(keyB, 2).isLimited).toBe(false)
  })
})

describe('getPublicRouteScope', () => {
  it('normalizes nested paths to the matching public route prefix', () => {
    expect(getPublicRouteScope('/tilt/login')).toBe('/tilt')
    expect(getPublicRouteScope('/preview/something')).toBe('/preview')
    expect(getPublicRouteScope('/unknown')).toBe('/unknown')
  })
})
