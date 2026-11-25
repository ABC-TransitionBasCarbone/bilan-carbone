import { getSessionEndingToday } from './studyCorrectionSharing'

describe('getSessionEndingToday', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 23, 12))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('selects the first session ending today using the UTC calendar date', () => {
    const sessions = [
      { id: 'yesterday', endDate: new Date('2026-10-22T23:59:59.999Z') },
      { id: 'today', endDate: new Date('2026-10-23T23:59:59.999Z') },
      { id: 'also-today', endDate: new Date('2026-10-23T00:00:00.000Z') },
    ]

    expect(getSessionEndingToday(sessions)?.id).toBe('today')
  })

  it('does not select a session ending on another date', () => {
    const sessions = [
      { endDate: new Date('2026-10-22T23:59:59.999Z') },
      { endDate: new Date('2026-10-24T00:00:00.000Z') },
      { endDate: new Date('2025-10-23T23:59:59.999Z') },
    ]

    expect(getSessionEndingToday(sessions)).toBeUndefined()
    expect(getSessionEndingToday([])).toBeUndefined()
  })
})
