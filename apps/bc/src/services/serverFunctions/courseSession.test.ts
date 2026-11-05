import { getAccountById } from '@/db/account'
import {
  getCourseSessionForProfessor,
  getCourseSessionStudies,
  getCourseSessionTrainees,
  removeCourseSessionTrainee,
} from '@/db/courseSession'
import { dbActualizedAuth } from '@/services/auth'
import { mockedSession } from '@/tests/utils/models/user'
import { withServerResponse } from '@/utils/serverResponse'
import { CourseSessionType, Environment, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { revalidatePath } from 'next/cache'
import {
  deleteCourseSessionTrainee,
  getProfessorCourseSession,
  getProfessorCourseSessionTrainees,
} from './courseSession'

let mockAccountStatus: UserStatus = UserStatus.ACTIVE

jest.mock('@/db/account', () => ({
  getAccountById: jest.fn(async () => ({ status: mockAccountStatus })),
}))

jest.mock('@/db/courseSession', () => ({
  getCourseSessionForProfessor: jest.fn(),
  getCourseSessionStudies: jest.fn(),
  getCourseSessionTrainees: jest.fn(),
  removeCourseSessionTrainee: jest.fn(),
}))
jest.mock('@/services/auth', () => ({ dbActualizedAuth: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/utils/serverResponse', () => ({
  withServerResponse: jest.fn(async (_name, operation) => {
    try {
      return { success: true, data: await operation() }
    } catch (error) {
      return { success: false, errorMessage: error instanceof Error ? error.message : 'error' }
    }
  }),
}))

const mockAuth = jest.mocked(dbActualizedAuth)
const mockGetSession = jest.mocked(getCourseSessionForProfessor)
const mockGetStudies = jest.mocked(getCourseSessionStudies)
const professor = { ...mockedSession, environment: Environment.COURSE_BC, organizationVersionId: 'professor-org' }
const courseSession = {
  id: 'course-session',
  name: 'Formation',
  type: CourseSessionType.INITIAL,
  startDate: new Date('2026-11-01'),
  endDate: new Date('2026-11-05'),
}

describe('getProfessorCourseSession server function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ user: professor, expires: '2026-12-01T00:00:00.000Z' })
    mockGetSession.mockResolvedValue(courseSession)
    mockGetStudies.mockResolvedValue([{ id: 'study' }])
  })

  it.each([Environment.COURSE_BC, Environment.COURSE_TILT])(
    'uses the authenticated professor and the response wrapper in %s',
    async (environment) => {
      mockAuth.mockResolvedValue({ user: { ...professor, environment }, expires: '2026-12-01T00:00:00.000Z' })

      expect(await getProfessorCourseSession(courseSession.id)).toEqual({
        success: true,
        data: { ...courseSession, studies: [{ id: 'study' }] },
      })
      expect(withServerResponse).toHaveBeenCalledWith('getProfessorCourseSession', expect.any(Function))
      expect(mockGetSession).toHaveBeenCalledWith(professor.organizationVersionId, environment, courseSession.id)
      expect(mockGetStudies).toHaveBeenCalledWith(courseSession, professor.organizationVersionId, environment)
    },
  )

  it('rejects unauthenticated calls without querying data', async () => {
    mockAuth.mockResolvedValue(null)
    expect(await getProfessorCourseSession(courseSession.id)).toEqual({
      success: false,
      errorMessage: NOT_AUTHORIZED,
    })
    expect(mockGetSession).not.toHaveBeenCalled()
    expect(mockGetStudies).not.toHaveBeenCalled()
  })

  it.each([Environment.BC, Environment.TILT, Environment.CUT, Environment.CLICKSON, Environment.MIP])(
    'rejects calls from %s without querying data',
    async (environment) => {
      mockAuth.mockResolvedValue({ user: { ...professor, environment }, expires: '2026-12-01T00:00:00.000Z' })
      expect(await getProfessorCourseSession(courseSession.id)).toEqual({
        success: false,
        errorMessage: NOT_AUTHORIZED,
      })
      expect(mockGetSession).not.toHaveBeenCalled()
      expect(mockGetStudies).not.toHaveBeenCalled()
    },
  )

  it('rejects accounts without an organization', async () => {
    mockAuth.mockResolvedValue({
      user: { ...professor, organizationVersionId: null },
      expires: '2026-12-01T00:00:00.000Z',
    })
    expect(await getProfessorCourseSession(courseSession.id)).toEqual({
      success: false,
      errorMessage: NOT_AUTHORIZED,
    })
    expect(mockGetSession).not.toHaveBeenCalled()
  })

  it('returns a missing session without querying studies', async () => {
    mockGetSession.mockResolvedValue(null)
    expect(await getProfessorCourseSession(courseSession.id)).toEqual({ success: true, data: null })
    expect(mockGetStudies).not.toHaveBeenCalled()
  })

  it('preserves an empty study list', async () => {
    mockGetStudies.mockResolvedValue([])
    expect(await getProfessorCourseSession(courseSession.id)).toEqual({
      success: true,
      data: { ...courseSession, studies: [] },
    })
  })
})

describe('getProfessorCourseSessionTrainees server function', () => {
  const trainees = [
    {
      id: 'trainee-account',
      organizationVersionId: 'trainee-org',
      user: { firstName: 'Camille', lastName: 'Martin', email: 'camille@example.com' },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockAccountStatus = UserStatus.ACTIVE
    mockAuth.mockResolvedValue({ user: professor, expires: '2026-12-01T00:00:00.000Z' })
    mockGetSession.mockResolvedValue(courseSession)
    jest.mocked(getCourseSessionTrainees).mockResolvedValue(trainees)
  })

  it.each([Environment.COURSE_BC, Environment.COURSE_TILT])(
    'checks access before reading trainees in %s',
    async (environment) => {
      mockAuth.mockResolvedValue({ user: { ...professor, environment }, expires: '2026-12-01T00:00:00.000Z' })

      expect(await getProfessorCourseSessionTrainees(courseSession.id)).toEqual({ success: true, data: trainees })
      expect(withServerResponse).toHaveBeenCalledWith('getProfessorCourseSessionTrainees', expect.any(Function))
      expect(getAccountById).toHaveBeenCalledWith(professor.accountId)
      expect(mockGetSession).toHaveBeenCalledWith(professor.organizationVersionId, environment, courseSession.id)
      expect(getCourseSessionTrainees).toHaveBeenCalledWith(courseSession.id, environment)
      expect(mockGetStudies).not.toHaveBeenCalled()
    },
  )

  it('rejects unauthenticated calls without reading trainees', async () => {
    mockAuth.mockResolvedValue(null)

    expect(await getProfessorCourseSessionTrainees(courseSession.id)).toEqual({
      success: false,
      errorMessage: NOT_AUTHORIZED,
    })
    expect(getCourseSessionTrainees).not.toHaveBeenCalled()
  })

  it('rejects accounts without an organization', async () => {
    mockAuth.mockResolvedValue({
      user: { ...professor, organizationVersionId: null },
      expires: '2026-12-01T00:00:00.000Z',
    })

    expect(await getProfessorCourseSessionTrainees(courseSession.id)).toEqual({
      success: false,
      errorMessage: NOT_AUTHORIZED,
    })
    expect(getCourseSessionTrainees).not.toHaveBeenCalled()
  })

  it.each([Environment.BC, Environment.TILT, Environment.CUT, Environment.CLICKSON, Environment.MIP])(
    'rejects calls from %s without reading trainees',
    async (environment) => {
      mockAuth.mockResolvedValue({ user: { ...professor, environment }, expires: '2026-12-01T00:00:00.000Z' })

      expect(await getProfessorCourseSessionTrainees(courseSession.id)).toEqual({
        success: false,
        errorMessage: NOT_AUTHORIZED,
      })
      expect(getCourseSessionTrainees).not.toHaveBeenCalled()
    },
  )

  it('rejects a missing session or another professor session without reading trainees', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await getProfessorCourseSessionTrainees(courseSession.id)).toEqual({
      success: false,
      errorMessage: NOT_AUTHORIZED,
    })
    expect(getCourseSessionTrainees).not.toHaveBeenCalled()
  })

  it('rejects suspended accounts without reading trainees', async () => {
    mockAccountStatus = UserStatus.SUSPENDED

    expect(await getProfessorCourseSessionTrainees(courseSession.id)).toEqual({
      success: false,
      errorMessage: NOT_AUTHORIZED,
    })
    expect(getCourseSessionTrainees).not.toHaveBeenCalled()
  })

  it('preserves an empty trainee list', async () => {
    jest.mocked(getCourseSessionTrainees).mockResolvedValue([])

    expect(await getProfessorCourseSessionTrainees(courseSession.id)).toEqual({ success: true, data: [] })
  })
})

describe('deleteCourseSessionTrainee server function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAccountStatus = UserStatus.ACTIVE
    mockAuth.mockResolvedValue({ user: professor, expires: '2026-12-01T00:00:00.000Z' })
    mockGetSession.mockResolvedValue(courseSession)
    jest.mocked(removeCourseSessionTrainee).mockResolvedValue({ count: 1 })
  })

  it.each([Environment.COURSE_BC, Environment.COURSE_TILT])(
    'removes only the enrollment and refreshes the session pages in %s',
    async (environment) => {
      mockAuth.mockResolvedValue({ user: { ...professor, environment }, expires: '2026-12-01T00:00:00.000Z' })

      expect(await deleteCourseSessionTrainee(courseSession.id, 'trainee-org')).toEqual({
        success: true,
        data: undefined,
      })
      expect(removeCourseSessionTrainee).toHaveBeenCalledWith(
        courseSession.id,
        'trainee-org',
        professor.organizationVersionId,
        environment,
      )
      expect(revalidatePath).toHaveBeenCalledWith(`/sessions/${courseSession.id}`)
      expect(revalidatePath).toHaveBeenCalledWith(`/sessions/${courseSession.id}/formees`)
    },
  )

  it('rejects unauthenticated calls without deleting anything', async () => {
    mockAuth.mockResolvedValue(null)

    expect(await deleteCourseSessionTrainee(courseSession.id, 'trainee-org')).toEqual({
      success: false,
      errorMessage: NOT_AUTHORIZED,
    })
    expect(removeCourseSessionTrainee).not.toHaveBeenCalled()
  })

  it('rejects accounts without an organization', async () => {
    mockAuth.mockResolvedValue({
      user: { ...professor, organizationVersionId: null },
      expires: '2026-12-01T00:00:00.000Z',
    })

    expect(await deleteCourseSessionTrainee(courseSession.id, 'trainee-org')).toEqual({
      success: false,
      errorMessage: NOT_AUTHORIZED,
    })
    expect(removeCourseSessionTrainee).not.toHaveBeenCalled()
  })

  it.each([Environment.BC, Environment.TILT, Environment.CUT, Environment.CLICKSON, Environment.MIP])(
    'rejects calls from %s without deleting anything',
    async (environment) => {
      mockAuth.mockResolvedValue({ user: { ...professor, environment }, expires: '2026-12-01T00:00:00.000Z' })

      expect(await deleteCourseSessionTrainee(courseSession.id, 'trainee-org')).toEqual({
        success: false,
        errorMessage: NOT_AUTHORIZED,
      })
      expect(mockGetSession).not.toHaveBeenCalled()
      expect(removeCourseSessionTrainee).not.toHaveBeenCalled()
    },
  )

  it('rejects a missing session or a session owned by another professor', async () => {
    mockGetSession.mockResolvedValue(null)

    expect(await deleteCourseSessionTrainee(courseSession.id, 'trainee-org')).toEqual({
      success: false,
      errorMessage: NOT_AUTHORIZED,
    })
    expect(mockGetSession).toHaveBeenCalledWith(
      professor.organizationVersionId,
      professor.environment,
      courseSession.id,
    )
    expect(removeCourseSessionTrainee).not.toHaveBeenCalled()
  })

  it('does not report success when the trainee is not enrolled in the session', async () => {
    jest.mocked(removeCourseSessionTrainee).mockResolvedValue({ count: 0 })

    expect(await deleteCourseSessionTrainee(courseSession.id, 'trainee-org')).toEqual({
      success: false,
      errorMessage: NOT_AUTHORIZED,
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
