import { getActiveMessageBannerWhere } from '@abc-transitionbascarbone/common/db/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { getMessageBannerDismissalTimeRemaining } from '@abc-transitionbascarbone/common/utils/messageBanner'
import { MessageBannerCommandValidation } from './messageBanner.command'

const validBanner = {
  message: 'Maintenance prévue',
  environments: [Environment.BC],
  startAt: new Date('2026-11-16T10:00:00.000Z'),
  endAt: new Date('2026-11-17T10:00:00.000Z'),
  active: true,
}

describe('MessageBannerCommandValidation', () => {
  it('accepts a banner with at least one environment and a valid time window', () => {
    expect(MessageBannerCommandValidation.safeParse(validBanner).success).toBe(true)
  })

  it('rejects a banner without environments or with an empty message', () => {
    expect(MessageBannerCommandValidation.safeParse({ ...validBanner, environments: [] }).success).toBe(false)
    expect(MessageBannerCommandValidation.safeParse({ ...validBanner, message: '  ' }).success).toBe(false)
  })

  it('rejects an end time that is not after the start time', () => {
    expect(MessageBannerCommandValidation.safeParse({ ...validBanner, endAt: validBanner.startAt }).success).toBe(false)
  })
})

describe('getActiveMessageBannerWhere', () => {
  it('filters active banners for the environment and inclusive display window', () => {
    const now = new Date('2026-11-16T10:00:00.000Z')

    expect(getActiveMessageBannerWhere(Environment.MIP, now)).toEqual({
      active: true,
      environments: { has: Environment.MIP },
      startAt: { lte: now },
      endAt: { gte: now },
    })
  })

  describe('getMessageBannerDismissalTimeRemaining', () => {
    const day = 24 * 60 * 60 * 1000

    it.each([
      { label: 'less than 24 hours', elapsed: day - 1, expected: 1 },
      { label: 'exactly 24 hours', elapsed: day, expected: 0 },
      { label: 'more than 24 hours', elapsed: day + 1, expected: 0 },
    ])('returns the remaining dismissal period at $label', ({ elapsed, expected }) => {
      expect(getMessageBannerDismissalTimeRemaining(0, elapsed)).toBe(expected)
    })
  })
})
