import { getCourseAccess, getTrainingAccessDays, hasCourseAccess, isInTraining } from './training'

const account = {
  professorCourseSessions: [],
  traineeCourseSessions: [
    { courseSession: { startDate: new Date('2026-01-01T00:00:00Z'), endDate: new Date('2026-01-10T00:00:00Z') } },
  ],
}

describe('training access', () => {
  const originalDays = process.env.TRAINING_ACCESS_DAYS

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-15T00:00:00Z'))
    process.env.TRAINING_ACCESS_DAYS = '10'
  })

  afterEach(() => {
    jest.useRealTimers()
    if (originalDays === undefined) {
      delete process.env.TRAINING_ACCESS_DAYS
    } else {
      process.env.TRAINING_ACCESS_DAYS = originalDays
    }
  })

  it.each([
    ['2025-12-31T23:59:59.999Z', false],
    ['2026-01-01T00:00:00.000Z', true],
    ['2026-01-10T00:00:00.000Z', true],
    ['2026-01-19T23:59:59.999Z', true],
    ['2026-01-20T00:00:00.000Z', false],
  ])('checks the exact training window at %s', (date, expected) => {
    expect(isInTraining(getCourseAccess(account), new Date(date))).toBe(expected)
  })

  it('does not grant access without a training session', () => {
    expect(isInTraining()).toBe(false)
    expect(hasCourseAccess()).toBe(false)
  })

  it('does not restore member rights while a training window is still open', () => {
    expect(isInTraining(getCourseAccess(account))).toBe(true)
    expect(hasCourseAccess(getCourseAccess(account))).toBe(false)
  })

  it('keeps professor access even without an ongoing training', () => {
    const courseAccess = getCourseAccess({
      professorCourseSessions: [{ id: 'professor-session' }],
      traineeCourseSessions: [],
    })
    expect(isInTraining(courseAccess)).toBe(false)
    expect(hasCourseAccess(courseAccess)).toBe(true)
  })

  it('accepts any ongoing session but not an expired or future one', () => {
    const courseAccess = getCourseAccess({
      ...account,
      traineeCourseSessions: [
        ...account.traineeCourseSessions,
        { courseSession: { startDate: new Date('2026-03-01'), endDate: new Date('2026-03-10') } },
      ],
    })
    expect(isInTraining(courseAccess, new Date('2026-01-15'))).toBe(true)
    expect(isInTraining(courseAccess, new Date('2026-02-01'))).toBe(false)
    expect(isInTraining(courseAccess, new Date('2026-03-01'))).toBe(true)
  })

  it('supports zero extra days and reloads a changed delay', () => {
    process.env.TRAINING_ACCESS_DAYS = '0'
    expect(isInTraining(getCourseAccess(account))).toBe(false)
    process.env.TRAINING_ACCESS_DAYS = '20'
    expect(isInTraining(getCourseAccess(account))).toBe(true)
  })

  it.each(['', ' ', '-1', '1.5', 'invalid', 'Infinity', '9007199254740992'])('rejects invalid delay %j', (value) => {
    process.env.TRAINING_ACCESS_DAYS = value
    expect(getTrainingAccessDays).toThrow('TRAINING_ACCESS_DAYS must be a non-negative integer')
  })

  it('requires an explicit delay', () => {
    delete process.env.TRAINING_ACCESS_DAYS
    expect(getTrainingAccessDays).toThrow('TRAINING_ACCESS_DAYS must be a non-negative integer')
  })
})
