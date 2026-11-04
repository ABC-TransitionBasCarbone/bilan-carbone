import { getCourseSessionForProfessor, getCourseSessionStudies } from '@/db/courseSession'
import { dbActualizedAuth } from '@/services/auth'
import { mockedSession } from '@/tests/utils/models/user'
import { withServerResponse } from '@/utils/serverResponse'
import { CourseSessionType, Environment } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { getProfessorCourseSession } from './courseSession'

jest.mock('@/db/courseSession', () => ({
  getCourseSessionForProfessor: jest.fn(),
  getCourseSessionStudies: jest.fn(),
}))
jest.mock('@/services/auth', () => ({ dbActualizedAuth: jest.fn() }))
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
