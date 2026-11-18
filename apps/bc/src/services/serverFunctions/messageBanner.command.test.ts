import { getActiveMessageBannerWhere } from '@abc-transitionbascarbone/common/db/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { getMessageBannerDismissalTimeRemaining } from '@abc-transitionbascarbone/common/utils/messageBanner'
import { DAY, TIME_IN_MS } from '@abc-transitionbascarbone/common/utils/time'
import { BCMessageBannerCommandValidation } from './messageBanner.command'

const validBanner = {
  message: 'Maintenance prévue',
  environments: [Environment.BC],
  startDate: new Date('2026-11-16T10:00:00.000Z'),
  endDate: new Date('2026-11-17T10:00:00.000Z'),
  active: true,
}

describe('BCMessageBannerCommandValidation', () => {
  it('accepts a banner with at least one environment and a valid time window', () => {
    expect(BCMessageBannerCommandValidation.safeParse(validBanner).success).toBe(true)
  })

  it('rejects a banner without environments or with an empty message', () => {
    expect(BCMessageBannerCommandValidation.safeParse({ ...validBanner, environments: [] }).success).toBe(false)
    expect(BCMessageBannerCommandValidation.safeParse({ ...validBanner, message: '  ' }).success).toBe(false)
  })

  it('rejects an end time that is not after the start time', () => {
    expect(BCMessageBannerCommandValidation.safeParse({ ...validBanner, endDate: validBanner.startDate }).success).toBe(
      false,
    )
  })

  it.each([[Environment.MIP], [Environment.BC, Environment.MIP]])('rejects MIP targets %j', (...environments) => {
    expect(BCMessageBannerCommandValidation.safeParse({ ...validBanner, environments }).success).toBe(false)
  })
})

describe('getActiveMessageBannerWhere', () => {
  it('filters active banners for the environment and inclusive display window', () => {
    const now = new Date('2026-11-16T10:00:00.000Z')

    expect(getActiveMessageBannerWhere(Environment.MIP, now)).toEqual({
      active: true,
      environments: { has: Environment.MIP },
      startDate: { lte: now },
      endDate: { gte: now },
    })
  })

  describe('getMessageBannerDismissalTimeRemaining', () => {
    const day = DAY * TIME_IN_MS

    it.each([
      { label: 'less than 24 hours', elapsed: day - 1, expected: 1 },
      { label: 'exactly 24 hours', elapsed: day, expected: 0 },
      { label: 'more than 24 hours', elapsed: day + 1, expected: 0 },
    ])('returns the remaining dismissal period at $label', ({ elapsed, expected }) => {
      expect(getMessageBannerDismissalTimeRemaining(0, elapsed)).toBe(expected)
    })
  })
})
