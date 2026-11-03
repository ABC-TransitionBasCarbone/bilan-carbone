import { CourseSessionType, Environment } from '@abc-transitionbascarbone/common/db/enums'
import { prismaClient } from './client.server'
import { getCourseSessionForProfessor, getCourseSessionStudies, isCourseProfessor } from './courseSession'

jest.mock('./client.server', () => ({
  prismaClient: {
    courseSession: { findFirst: jest.fn() },
    study: { findMany: jest.fn() },
  },
}))

const mockFindSession = jest.mocked(prismaClient.courseSession.findFirst)
const mockFindStudies = jest.mocked(prismaClient.study.findMany)
const professor = { organizationVersionId: 'professor-org', environment: Environment.COURSE_BC }
const session = {
  id: 'session',
  name: 'Formation carbone',
  type: CourseSessionType.INITIAL,
  startDate: new Date('2026-11-01'),
  endDate: new Date('2026-11-05'),
  environment: Environment.COURSE_BC,
  professorOrganizationVersionId: professor.organizationVersionId,
  courseOrganismId: 'organism',
  code: 'code',
  createdAt: new Date('2026-10-01'),
  updatedAt: new Date('2026-10-01'),
}

describe('course session database queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindSession.mockResolvedValue(session)
    mockFindStudies.mockResolvedValue([])
  })

  it('restricts session access to its professor organization and environment', async () => {
    const result = await getCourseSessionForProfessor(
      professor.organizationVersionId,
      professor.environment,
      session.id,
    )

    expect(mockFindSession).toHaveBeenCalledWith({
      where: {
        id: session.id,
        professorOrganizationVersionId: professor.organizationVersionId,
        environment: professor.environment,
      },
      select: { id: true, name: true, type: true, startDate: true, endDate: true },
    })
    expect(result).toEqual(session)
  })

  it('filters studies by type, environment and creator enrollment, not study invitations', async () => {
    await getCourseSessionStudies(session, professor.organizationVersionId, professor.environment)

    expect(mockFindStudies).toHaveBeenCalledWith({
      where: {
        courseSessionType: CourseSessionType.INITIAL,
        organizationVersion: { environment: professor.environment },
        createdBy: {
          environment: professor.environment,
          organizationVersion: {
            traineeCourseSessions: {
              some: {
                courseSessionId: session.id,
                courseSession: {
                  professorOrganizationVersionId: professor.organizationVersionId,
                  environment: professor.environment,
                },
              },
            },
          },
        },
      },
      select: { id: true },
      orderBy: [
        { createdBy: { user: { lastName: 'asc' } } },
        { createdBy: { user: { firstName: 'asc' } } },
        { name: 'asc' },
      ],
    })
  })

  it('returns null when the session is missing or belongs to another professor', async () => {
    mockFindSession.mockResolvedValue(null)
    expect(
      await getCourseSessionForProfessor(professor.organizationVersionId, professor.environment, session.id),
    ).toBeNull()
    expect(mockFindStudies).not.toHaveBeenCalled()
  })

  it('identifies a professor from a session they teach in the same environment', async () => {
    expect(await isCourseProfessor(professor.organizationVersionId, professor.environment)).toBe(true)
    expect(mockFindSession).toHaveBeenCalledWith({
      where: { professorOrganizationVersionId: professor.organizationVersionId, environment: professor.environment },
      select: { id: true },
    })

    mockFindSession.mockResolvedValue(null)
    expect(await isCourseProfessor(professor.organizationVersionId, professor.environment)).toBe(false)
  })

  it('does not treat an account without organization as a professor', async () => {
    expect(await isCourseProfessor(null, professor.environment)).toBe(false)
    expect(mockFindSession).not.toHaveBeenCalled()
  })
})
