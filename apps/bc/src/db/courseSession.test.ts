import { getMockedAccount } from '@/tests/utils/models/user'
import {
  CourseSessionTraineeOrganizationStatus,
  CourseSessionType,
  Environment,
  Role,
  UserSource,
  UserStatus,
} from '@abc-transitionbascarbone/common/db/enums'
import { prismaClient } from './client.server'
import {
  getCourseSessionForProfessor,
  getCourseSessionStudies,
  getCourseSessionTrainees,
  isCourseProfessor,
  prepareCourseSessionTraineeRegistrations,
  registerCourseSessionTrainee,
  removeCourseSessionTrainee,
  saveCourseSessionAttendance,
} from './courseSession'
import { createUsersWithAccount } from './user'

jest.mock('./user', () => ({ createUsersWithAccount: jest.fn() }))

jest.mock('./client.server', () => {
  const transaction = {
    courseSession: { findFirst: jest.fn(), findUniqueOrThrow: jest.fn() },
    account: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    courseSessionTraineeOrganization: {
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    courseSessionTraineeRemoval: { upsert: jest.fn(), deleteMany: jest.fn() },
    attendance: { upsert: jest.fn(), deleteMany: jest.fn() },
    study: { findMany: jest.fn() },
  }
  return { prismaClient: { ...transaction, $transaction: jest.fn((operation) => operation(transaction)) } }
})

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

const previousAccessDays = process.env.COURSE_SESSION_ACCESS_DAYS

beforeAll(() => {
  process.env.COURSE_SESSION_ACCESS_DAYS = '7'
})

afterAll(() => {
  if (previousAccessDays === undefined) {
    delete process.env.COURSE_SESSION_ACCESS_DAYS
  } else {
    process.env.COURSE_SESSION_ACCESS_DAYS = previousAccessDays
  }
})

describe('course session database queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindSession.mockResolvedValue(session)
    mockFindStudies.mockResolvedValue([])
    jest.mocked(prismaClient.courseSessionTraineeOrganization.deleteMany).mockResolvedValue({ count: 1 })
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

  it('lists trainees enrolled in the session and environment, ordered by name', async () => {
    const alice = {
      ...getMockedAccount({ id: 'alice', organizationVersionId: 'org-1' }),
      user: { firstName: 'Alice', lastName: 'Martin', email: 'alice@example.com' },
    }
    const camille = {
      ...getMockedAccount({ id: 'camille', organizationVersionId: 'org-1' }),
      user: { firstName: 'Camille', lastName: 'Martin', email: 'camille@example.com' },
    }
    const zoe = {
      ...getMockedAccount({ id: 'zoe', organizationVersionId: 'org-2' }),
      user: { firstName: 'Zoe', lastName: 'Albert', email: 'zoe@example.com' },
    }
    const result = {
      ...session,
      traineeOrganizations: [
        { attendance: { id: 'attendance-1' }, organizationVersion: { userAccounts: [camille, alice] } },
        { attendance: null, organizationVersion: { userAccounts: [zoe] } },
      ],
    }
    jest.mocked(prismaClient.courseSession.findUniqueOrThrow).mockResolvedValueOnce(result)

    expect(await getCourseSessionTrainees(session.id, professor.environment)).toEqual([
      { ...zoe, attendance: null },
      { ...alice, attendance: { id: 'attendance-1' } },
      { ...camille, attendance: { id: 'attendance-1' } },
    ])
    expect(prismaClient.courseSession.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: session.id, environment: professor.environment },
        select: expect.objectContaining({
          traineeOrganizations: expect.objectContaining({
            select: expect.objectContaining({
              organizationVersion: {
                select: {
                  userAccounts: expect.objectContaining({ where: { environment: professor.environment } }),
                },
              },
            }),
          }),
        }),
      }),
    )
  })

  it('returns an empty list for a session without trainees', async () => {
    const result = { ...session, traineeOrganizations: [] }
    jest.mocked(prismaClient.courseSession.findUniqueOrThrow).mockResolvedValueOnce(result)
    expect(await getCourseSessionTrainees(session.id, professor.environment)).toEqual([])
  })

  it('only removes the enrollment in the session owned by the authenticated professor', async () => {
    await removeCourseSessionTrainee(session.id, 'trainee-org', professor.organizationVersionId, professor.environment)

    expect(prismaClient.courseSessionTraineeOrganization.deleteMany).toHaveBeenCalledWith({
      where: {
        courseSessionId: session.id,
        organizationVersionId: 'trainee-org',
        courseSession: {
          professorOrganizationVersionId: professor.organizationVersionId,
          environment: professor.environment,
        },
      },
    })
    expect(prismaClient.courseSessionTraineeRemoval.upsert).toHaveBeenCalledWith({
      where: {
        courseSessionId_organizationVersionId: { courseSessionId: session.id, organizationVersionId: 'trainee-org' },
      },
      create: { courseSessionId: session.id, organizationVersionId: 'trainee-org', removedAt: expect.any(Date) },
      update: { removedAt: expect.any(Date) },
    })
    expect(prismaClient.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' })
  })

  it('does not record a deletion when the trainee is not enrolled in an authorized session', async () => {
    jest.mocked(prismaClient.courseSessionTraineeOrganization.deleteMany).mockResolvedValue({ count: 0 })

    expect(
      await removeCourseSessionTrainee(
        session.id,
        'trainee-org',
        professor.organizationVersionId,
        professor.environment,
      ),
    ).toEqual({ count: 0 })
    expect(prismaClient.courseSessionTraineeRemoval.upsert).not.toHaveBeenCalled()
  })
})

describe('registerCourseSessionTrainee', () => {
  const trainee = { firstName: 'Camille', lastName: 'Martin', email: 'camille@example.com' }
  const account = getMockedAccount({ organizationVersionId: 'trainee-org', environment: professor.environment })
  const participantAccount = { ...account, user: trainee }
  const registration = {
    id: 'registration',
    courseSessionId: session.id,
    organizationVersionId: 'trainee-org',
    courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE,
    createdAt: new Date('2026-11-04'),
    updatedAt: new Date('2026-11-04'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date('2026-11-04T12:00:00Z'))
    mockFindSession.mockResolvedValue(session)
    jest.mocked(prismaClient.account.findFirst).mockResolvedValue(account)
    jest.mocked(prismaClient.account.findMany).mockResolvedValue([participantAccount])
    jest.mocked(prismaClient.account.create).mockResolvedValue(account)
    jest.mocked(prismaClient.account.update).mockResolvedValue(account)
    jest.mocked(prismaClient.courseSessionTraineeOrganization.findMany).mockResolvedValue([])
    jest.mocked(prismaClient.courseSessionTraineeOrganization.createMany).mockResolvedValue({ count: 1 })
    jest.mocked(prismaClient.courseSessionTraineeOrganization.deleteMany).mockResolvedValue({ count: 1 })
    jest.mocked(createUsersWithAccount).mockResolvedValue({ newUsers: { count: 0 }, newAccounts: { count: 0 } })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('reuses the existing account and removes its deletion trace in the same transaction', async () => {
    expect(
      await registerCourseSessionTrainee(session.id, professor.organizationVersionId, professor.environment, trainee),
    ).toEqual({ status: 'added', previousSessionIds: [] })
    expect(createUsersWithAccount).not.toHaveBeenCalled()
    expect(prismaClient.account.create).not.toHaveBeenCalled()
    expect(prismaClient.courseSessionTraineeOrganization.createMany).toHaveBeenCalledWith({
      data: [
        {
          courseSessionId: session.id,
          organizationVersionId: 'trainee-org',
          courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE,
        },
      ],
      skipDuplicates: true,
    })
    expect(prismaClient.courseSessionTraineeRemoval.deleteMany).toHaveBeenCalledWith({
      where: { courseSessionId: session.id, organizationVersionId: 'trainee-org' },
    })
    expect(prismaClient.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' })
  })

  it('creates a course account and personal organization without overwriting an existing user', async () => {
    jest.mocked(prismaClient.account.findFirst).mockResolvedValueOnce(null)

    await registerCourseSessionTrainee(session.id, professor.organizationVersionId, professor.environment, trainee)

    expect(createUsersWithAccount).toHaveBeenCalledWith(
      [
        {
          ...trainee,
          source: UserSource.CRON,
          account: {
            environment: professor.environment,
            role: Role.DEFAULT,
            status: UserStatus.IMPORTED,
            user: { create: undefined, connectOrCreate: undefined, connect: undefined },
          },
        },
      ],
      expect.objectContaining({ account: prismaClient.account }),
    )
    expect(prismaClient.account.create).not.toHaveBeenCalled()
  })

  it('creates an organization for an existing course account without one', async () => {
    jest.mocked(prismaClient.account.findFirst).mockResolvedValue({ ...account, organizationVersionId: null })
    jest
      .mocked(prismaClient.account.findMany)
      .mockResolvedValue([{ ...participantAccount, organizationVersionId: null }])

    await registerCourseSessionTrainee(session.id, professor.organizationVersionId, professor.environment, trainee)

    expect(prismaClient.account.update).toHaveBeenCalledWith({
      where: { id: account.id },
      data: {
        organizationVersion: {
          create: { environment: professor.environment, organization: { create: { name: 'Camille Martin' } } },
        },
      },
      select: { organizationVersionId: true },
    })
    expect(prismaClient.account.create).not.toHaveBeenCalled()
  })

  it('rejects a suspended trainee account', async () => {
    jest.mocked(prismaClient.account.findFirst).mockResolvedValue({ ...account, status: UserStatus.SUSPENDED })

    await expect(
      registerCourseSessionTrainee(session.id, professor.organizationVersionId, professor.environment, trainee),
    ).rejects.toThrow('Not authorized')
    expect(prismaClient.courseSessionTraineeOrganization.createMany).not.toHaveBeenCalled()
  })

  it('allows a non-suspended super admin to be registered as a trainee', async () => {
    jest.mocked(prismaClient.account.findFirst).mockResolvedValue({ ...account, role: Role.SUPER_ADMIN })

    expect(
      await registerCourseSessionTrainee(session.id, professor.organizationVersionId, professor.environment, trainee),
    ).toEqual({ status: 'added', previousSessionIds: [] })
  })

  it('rejects a session belonging to another professor through the registration permission', async () => {
    mockFindSession.mockResolvedValue({ ...session, professorOrganizationVersionId: 'other-professor-org' })

    await expect(
      registerCourseSessionTrainee(session.id, professor.organizationVersionId, professor.environment, trainee),
    ).rejects.toThrow('Not authorized')
    expect(createUsersWithAccount).not.toHaveBeenCalled()
    expect(prismaClient.account.create).not.toHaveBeenCalled()
    expect(prismaClient.courseSessionTraineeOrganization.createMany).not.toHaveBeenCalled()
    expect(prismaClient.courseSessionTraineeRemoval.deleteMany).not.toHaveBeenCalled()
  })

  it('returns a success when the trainee is already registered without changing their status', async () => {
    jest.mocked(prismaClient.courseSessionTraineeOrganization.createMany).mockResolvedValue({ count: 0 })

    expect(
      await registerCourseSessionTrainee(session.id, professor.organizationVersionId, professor.environment, trainee),
    ).toEqual({
      status: 'alreadyRegistered',
      previousSessionIds: [],
    })
    expect(prismaClient.courseSessionTraineeOrganization.deleteMany).not.toHaveBeenCalled()
  })

  it('asks for confirmation before transferring an existing trainee', async () => {
    jest
      .mocked(prismaClient.courseSessionTraineeOrganization.findMany)
      .mockResolvedValue([{ ...registration, id: '1234', courseSessionId: 'other-session' }])

    expect(
      await registerCourseSessionTrainee(session.id, professor.organizationVersionId, professor.environment, trainee),
    ).toEqual({
      status: 'confirmationRequired',
      sessionIds: ['other-session'],
    })
    expect(prismaClient.courseSessionTraineeOrganization.createMany).not.toHaveBeenCalled()
    expect(prismaClient.courseSessionTraineeOrganization.deleteMany).not.toHaveBeenCalled()
    expect(prismaClient.courseSessionTraineeRemoval.deleteMany).not.toHaveBeenCalled()
  })

  it('transfers the trainee after confirmation and preserves the old-session deletion date', async () => {
    jest
      .mocked(prismaClient.courseSessionTraineeOrganization.findMany)
      .mockResolvedValue([{ ...registration, id: '1234', courseSessionId: 'other-session' }])

    expect(
      await registerCourseSessionTrainee(session.id, professor.organizationVersionId, professor.environment, {
        ...trainee,
        confirmedTransferFrom: ['other-session'],
      }),
    ).toEqual({ status: 'transferred', previousSessionIds: ['other-session'] })
    expect(prismaClient.courseSessionTraineeRemoval.upsert).toHaveBeenCalledWith({
      where: {
        courseSessionId_organizationVersionId: {
          courseSessionId: 'other-session',
          organizationVersionId: 'trainee-org',
        },
      },
      create: { courseSessionId: 'other-session', organizationVersionId: 'trainee-org', removedAt: expect.any(Date) },
      update: { removedAt: expect.any(Date) },
    })
  })

  it('rejects a session not owned by the professor before modifying accounts', async () => {
    mockFindSession.mockResolvedValue(null)

    await expect(
      registerCourseSessionTrainee(session.id, professor.organizationVersionId, professor.environment, trainee),
    ).rejects.toThrow('Not authorized')
    expect(prismaClient.account.findFirst).not.toHaveBeenCalled()
  })

  it.each([
    ['2026-10-31T12:00:00Z', CourseSessionTraineeOrganizationStatus.INACTIVE],
    ['2026-11-06T12:00:00Z', CourseSessionTraineeOrganizationStatus.ACTIVE],
    ['2026-11-12T23:59:59.999Z', CourseSessionTraineeOrganizationStatus.ACTIVE],
    ['2026-11-13T00:00:00Z', CourseSessionTraineeOrganizationStatus.INACTIVE],
  ])('sets enrollment status from the access period at %s', async (date, courseStatus) => {
    jest.setSystemTime(new Date(date))

    await registerCourseSessionTrainee(session.id, professor.organizationVersionId, professor.environment, trainee)

    expect(prismaClient.courseSessionTraineeOrganization.createMany).toHaveBeenCalledWith({
      data: [
        {
          courseSessionId: session.id,
          organizationVersionId: 'trainee-org',
          courseStatus,
        },
      ],
      skipDuplicates: true,
    })
  })
})

describe('prepareCourseSessionTraineeRegistrations', () => {
  const conflict = {
    id: 'conflict-registration',
    courseSessionId: 'old-session',
    organizationVersionId: 'trainee-org',
    courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE,
    createdAt: new Date('2026-11-04'),
    updatedAt: new Date('2026-11-04'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date('2026-11-04T12:00:00Z'))
    jest.mocked(prismaClient.courseSessionTraineeOrganization.findMany).mockResolvedValue([conflict])
    jest.mocked(prismaClient.courseSessionTraineeOrganization.deleteMany).mockResolvedValue({ count: 1 })
  })

  describe('saveCourseSessionAttendance', () => {
    const enrollments = ['one', 'two'].map((id) => ({
      id: `enrollment-${id}`,
      organizationVersionId: id,
      courseSessionId: session.id,
      courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }))

    beforeEach(() => {
      jest.clearAllMocks()
      mockFindSession.mockResolvedValue(session)
      jest.mocked(prismaClient.courseSessionTraineeOrganization.findMany).mockResolvedValue(enrollments)
    })

    it('upserts selected enrollments once, ignores outsiders and scopes deletions to this session', async () => {
      await saveCourseSessionAttendance(session.id, professor.organizationVersionId, professor.environment, [
        'one',
        'one',
        'outsider',
      ])

      expect(mockFindSession).toHaveBeenCalledWith({
        where: {
          id: session.id,
          professorOrganizationVersionId: professor.organizationVersionId,
          environment: professor.environment,
        },
        select: { id: true },
      })
      expect(prismaClient.courseSessionTraineeOrganization.findMany).toHaveBeenCalledWith({
        where: { courseSessionId: session.id },
        select: { id: true, organizationVersionId: true },
      })
      expect(prismaClient.attendance.upsert).toHaveBeenCalledTimes(1)
      expect(prismaClient.attendance.upsert).toHaveBeenCalledWith({
        where: { courseSessionTraineeOrganizationId: 'enrollment-one' },
        create: { courseSessionTraineeOrganizationId: 'enrollment-one' },
        update: {},
      })
      expect(prismaClient.attendance.deleteMany).toHaveBeenCalledWith({
        where: {
          traineeOrganization: { courseSessionId: session.id, organizationVersionId: { notIn: ['one', 'outsider'] } },
        },
      })
      expect(prismaClient.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' })
    })

    it('clears attendance only for this session when the selection is empty', async () => {
      await saveCourseSessionAttendance(session.id, professor.organizationVersionId, professor.environment, [])
      expect(prismaClient.attendance.upsert).not.toHaveBeenCalled()
      expect(prismaClient.attendance.deleteMany).toHaveBeenCalledWith({
        where: { traineeOrganization: { courseSessionId: session.id, organizationVersionId: { notIn: [] } } },
      })
    })

    it('rejects unauthorized sessions before reading enrollments or writing attendance', async () => {
      mockFindSession.mockResolvedValue(null)
      await expect(
        saveCourseSessionAttendance(session.id, professor.organizationVersionId, professor.environment, ['one']),
      ).rejects.toThrow('Not authorized')
      expect(prismaClient.courseSessionTraineeOrganization.findMany).not.toHaveBeenCalled()
      expect(prismaClient.attendance.upsert).not.toHaveBeenCalled()
      expect(prismaClient.attendance.deleteMany).not.toHaveBeenCalled()
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('requires confirmation before changing an existing registration', async () => {
    const result = await prepareCourseSessionTraineeRegistrations(session, ['trainee-org'], prismaClient, {
      source: 'manual',
      confirmedSessionIds: [],
    })

    expect(result.requiresConfirmation).toBe(true)
    expect(result.previousSessionIds).toEqual(['old-session'])
    expect(prismaClient.courseSessionTraineeOrganization.deleteMany).not.toHaveBeenCalled()
    expect(prismaClient.courseSessionTraineeRemoval.upsert).not.toHaveBeenCalled()
  })

  it('uses the same type and environment regardless of the training organism', async () => {
    await prepareCourseSessionTraineeRegistrations(session, ['trainee-org'], prismaClient, { source: 'ftp' })

    expect(prismaClient.courseSessionTraineeOrganization.findMany).toHaveBeenCalledWith({
      where: {
        organizationVersionId: { in: ['trainee-org'] },
        courseSessionId: { not: session.id },
        courseSession: { type: session.type, environment: session.environment },
      },
      select: { courseSessionId: true, organizationVersionId: true },
    })
    expect(prismaClient.courseSessionTraineeRemoval.upsert).not.toHaveBeenCalled()
  })

  it('records a confirmed manual transfer so that FTP priority rules still apply', async () => {
    const result = await prepareCourseSessionTraineeRegistrations(session, ['trainee-org'], prismaClient, {
      source: 'manual',
      confirmedSessionIds: ['old-session'],
    })

    expect(result.requiresConfirmation).toBe(false)
    expect(result.removedCount).toBe(1)
    expect(prismaClient.courseSessionTraineeOrganization.deleteMany).toHaveBeenCalledWith({
      where: {
        courseSession: { type: session.type, environment: session.environment },
        OR: [{ courseSessionId: 'old-session', organizationVersionId: 'trainee-org' }],
      },
    })
    expect(prismaClient.courseSessionTraineeRemoval.upsert).toHaveBeenCalledWith({
      where: {
        courseSessionId_organizationVersionId: { courseSessionId: 'old-session', organizationVersionId: 'trainee-org' },
      },
      create: { courseSessionId: 'old-session', organizationVersionId: 'trainee-org', removedAt: expect.any(Date) },
      update: { removedAt: expect.any(Date) },
    })
  })

  it('requires a new confirmation when the registration changed in the meantime', async () => {
    const result = await prepareCourseSessionTraineeRegistrations(session, ['trainee-org'], prismaClient, {
      source: 'manual',
      confirmedSessionIds: ['different-session'],
    })

    expect(result.requiresConfirmation).toBe(true)
    expect(prismaClient.courseSessionTraineeOrganization.deleteMany).not.toHaveBeenCalled()
  })

  it('preserves existing registrations in the target session and deduplicates the input', async () => {
    jest.mocked(prismaClient.courseSessionTraineeOrganization.findMany).mockResolvedValue([])

    const result = await prepareCourseSessionTraineeRegistrations(
      session,
      ['trainee-org', 'trainee-org'],
      prismaClient,
      {
        source: 'manual',
        confirmedSessionIds: [],
      },
    )

    expect(result.requiresConfirmation).toBe(false)
    expect(result.data).toEqual([
      { organizationVersionId: 'trainee-org', courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE },
    ])
    expect(prismaClient.courseSessionTraineeOrganization.deleteMany).not.toHaveBeenCalled()
  })
})
