import { prismaClient } from '@/db/client.server'
import { createUsersWithAccount } from '@/db/user'
import type { CourseSession } from '@abc-transitionbascarbone/common/db'
import { CourseSessionTraineeOrganizationStatus, Environment } from '@abc-transitionbascarbone/common/db/enums'
import { sendCourseSessionsCreatedEmail } from '@abc-transitionbascarbone/common/services/email/email'
import { Client } from 'basic-ftp'
import { getJsDateFromExcel } from 'excel-date-to-js'
import fs from 'fs'
import xlsx from 'node-xlsx'
import {
  getCourseSessionsFromFTP,
  importCourseSessionsFromFTP,
  parseCourseSessionWorkbook,
} from './importTrainingSessions'

jest.mock('basic-ftp', () => ({
  Client: jest.fn(() => ({ access: jest.fn(), downloadTo: jest.fn(), close: jest.fn() })),
}))

jest.mock('@/db/client.server', () => {
  const courseOrganism = { findMany: jest.fn() }
  const account = { findMany: jest.fn(), update: jest.fn() }
  const courseSession = { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn(), updateMany: jest.fn() }
  const courseSessionTraineeOrganization = { deleteMany: jest.fn() }
  const transaction = { account, courseSession, courseSessionTraineeOrganization }
  return {
    prismaClient: {
      courseOrganism,
      account,
      courseSession,
      courseSessionTraineeOrganization,
      $transaction: jest.fn((operation) =>
        Array.isArray(operation) ? Promise.all(operation) : operation(transaction),
      ),
    },
  }
})

jest.mock('@/db/user', () => ({ createUsersWithAccount: jest.fn() }))

jest.mock('@abc-transitionbascarbone/common/services/email/email', () => ({
  sendCourseSessionsCreatedEmail: jest.fn(),
}))

jest.mock('fs', () => {
  const mockedFs = {
    createWriteStream: jest.fn(),
    promises: { readFile: jest.fn() },
  }
  return { __esModule: true, default: mockedFs, ...mockedFs }
})

jest.mock('node-xlsx', () => ({
  __esModule: true,
  default: { parse: jest.fn() },
}))

const mockFindCourseOrganisms = jest.mocked(prismaClient.courseOrganism.findMany)
const mockFindAccounts = jest.mocked(prismaClient.account.findMany)
const mockUpdateAccount = prismaClient.account.update as jest.Mock
const mockFindCourseSessions = jest.mocked(prismaClient.courseSession.findMany)
const mockUpsertCourseSession = jest.mocked(prismaClient.courseSession.upsert)
const mockDeleteCourseSessions = jest.mocked(prismaClient.courseSession.deleteMany)
const mockUpdateCourseSessions = jest.mocked(prismaClient.courseSession.updateMany)
const mockDeleteTrainees = jest.mocked(prismaClient.courseSessionTraineeOrganization.deleteMany)
const mockCreateUsersWithAccount = jest.mocked(createUsersWithAccount)
const mockSendCourseSessionsCreatedEmail = jest.mocked(sendCourseSessionsCreatedEmail)
const savedSessions: CourseSession[] = [
  {
    id: 'session-1',
    courseOrganismId: 'organism-1',
    name: 'Session Numéro 1',
    type: 'M1',
    environment: Environment.COURSE_BC,
    startDate: getJsDateFromExcel(46277),
    endDate: new Date(getJsDateFromExcel(46377).setUTCHours(23, 59, 59, 999)),
    code: '12345678',
    professorOrganizationVersionId: 'organization-2',
    createdAt: new Date('2026-10-15'),
    updatedAt: new Date('2026-10-15'),
  },
  {
    id: 'session-2',
    courseOrganismId: 'organism-1',
    name: 'Session Numéro 2',
    type: null,
    environment: Environment.COURSE_TILT,
    startDate: getJsDateFromExcel(46368),
    endDate: new Date(getJsDateFromExcel(46508).setUTCHours(23, 59, 59, 999)),
    code: '23456789',
    professorOrganizationVersionId: 'organization-5',
    createdAt: new Date('2026-10-15'),
    updatedAt: new Date('2026-10-15'),
  },
]
const workbook = [
  {
    name: 'Sessions',
    data: [
      ['Nom de la session ', 'Date de début ', 'Date de fin ', 'Environment'],
      ['Session Numéro 1', 46277, 46377, 'BC'],
      ['Session Numéro 2 ', 46368, 46508, 'TILT'],
    ],
  },
  {
    name: 'Stagiaires',
    data: [
      ['Nom de la session ', 'Email', 'Prénom', 'Nom'],
      ['Session Numéro 1', 'test.abc2@abc-transitionbascarbone.fr', 'Test', 'ABC'],
      ['Session Numéro 2 ', 'bc-admin-0@yopmail.com', 'Admin', 'BC'],
      ['Session Numéro 1', 'test.abc@abc-transitionbascarbone.fr', 'Test', 'ABC'],
      ['Session Numéro 2 ', 'test-formation@yopmail.com', 'Test', 'Formation'],
    ],
  },
  {
    name: 'Formateur',
    data: [
      ['Nom de la session ', 'Email', 'Prénom', 'Nom'],
      ['Session Numéro 1', 'onboarding@yopmail.com', 'Onboarding', 'Yopmail'],
      ['Session Numéro 2 ', 'bc-cr-admin-0@yopmail.com', 'Admin', 'CR'],
    ],
  },
]

const withParticipants = (session: CourseSession) => {
  const { sessions: participants } = parseCourseSessionWorkbook(Buffer.from('xlsx content'), session.courseOrganismId)
  const importedSession = participants.find(({ name }) => name === session.name)!
  return {
    ...session,
    traineeOrganizations: importedSession.trainees.map((user) => ({
      organizationVersion: { userAccounts: [{ user }] },
    })),
    professorOrganization: importedSession.professor ? { userAccounts: [{ user: importedSession.professor }] } : null,
  }
}

describe('getCourseSessionsFromFTP', () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] }).setSystemTime(new Date('2026-01-01'))
    jest.clearAllMocks()
    process.env.FTP_HOST = 'host'
    process.env.FTP_USER = 'user'
    process.env.FTP_PASSWORD = 'password'
    process.env.FTP_PORT = '21'
    process.env.FTP_TRAINING_SESSIONS_FILE_PATH = '/training/'
    process.env.FTP_TRAINING_SESSIONS_FILE_NAME = 'sessions.xlsx'
    mockFindCourseOrganisms.mockResolvedValue([
      {
        id: 'organism-1',
        ftpPath: 'partner-a',
        name: 'Partner A',
        contactEmail: 'contact@example.org',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    jest.mocked(fs.createWriteStream).mockReturnValue('stream' as unknown as fs.WriteStream)
    jest.mocked(fs.promises.readFile).mockResolvedValue(Buffer.from('xlsx content'))
    jest.mocked(xlsx.parse).mockReturnValue(workbook)
    mockCreateUsersWithAccount.mockResolvedValue({
      newUsers: { count: 6 },
      newAccounts: { count: 6 },
    })
    mockFindAccounts.mockResolvedValue(
      [
        ['test.abc2@abc-transitionbascarbone.fr', 'Test', 'ABC', 'COURSE_BC'],
        ['test.abc@abc-transitionbascarbone.fr', 'Test', 'ABC', 'COURSE_BC'],
        ['onboarding@yopmail.com', 'Onboarding', 'Yopmail', 'COURSE_BC'],
        ['bc-admin-0@yopmail.com', 'Admin', 'BC', 'COURSE_TILT'],
        ['test-formation@yopmail.com', 'Test', 'Formation', 'COURSE_TILT'],
        ['bc-cr-admin-0@yopmail.com', 'Admin', 'CR', 'COURSE_TILT'],
      ].map(([email, firstName, lastName, environment], index) => ({
        id: `account-${index}`,
        environment: environment as Environment,
        organizationVersionId: `organization-${index}`,
        user: { email, firstName, lastName },
      })) as never,
    )
    mockFindCourseSessions.mockReset().mockResolvedValue([])
    mockUpsertCourseSession
      .mockReset()
      .mockResolvedValueOnce(withParticipants(savedSessions[0]))
      .mockResolvedValueOnce(withParticipants(savedSessions[1]))
    mockDeleteCourseSessions.mockResolvedValue({ count: 0 })
    mockDeleteTrainees.mockResolvedValue({ count: 0 })
    mockUpdateCourseSessions.mockResolvedValue({ count: 0 })
    mockSendCourseSessionsCreatedEmail.mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('does not add trainees or replace existing registrations after a session ends', async () => {
    jest.setSystemTime(new Date(savedSessions[1].endDate.getTime() + 24 * 60 * 60 * 1000))

    await importCourseSessionsFromFTP()

    expect(mockUpsertCourseSession).not.toHaveBeenCalled()
  })

  it('reads and maps all three sheets from the organism FTP path', async () => {
    const { sessions, deletions } = await getCourseSessionsFromFTP()
    const ftpClient = jest.mocked(Client).mock.results[0].value

    expect(ftpClient.access).toHaveBeenCalledWith({ host: 'host', user: 'user', password: 'password', port: 21 })
    expect(ftpClient.downloadTo).toHaveBeenCalledWith(expect.anything(), '/training/partner-a/sessions.xlsx')
    expect(fs.promises.readFile).toHaveBeenCalledWith('sessions.xlsx')
    expect(xlsx.parse).toHaveBeenCalledWith(Buffer.from('xlsx content'))
    expect(ftpClient.close).toHaveBeenCalledTimes(1)
    expect(deletions).toEqual([])
    expect(sessions).toEqual([
      {
        courseOrganismId: 'organism-1',
        name: 'Session Numéro 1',
        type: 'M1',
        startDate: getJsDateFromExcel(46277),
        endDate: savedSessions[0].endDate,
        environment: 'COURSE_BC',
        trainees: [
          { email: 'test.abc2@abc-transitionbascarbone.fr', firstName: 'Test', lastName: 'ABC' },
          { email: 'test.abc@abc-transitionbascarbone.fr', firstName: 'Test', lastName: 'ABC' },
        ],
        professor: { email: 'onboarding@yopmail.com', firstName: 'Onboarding', lastName: 'Yopmail' },
      },
      {
        courseOrganismId: 'organism-1',
        name: 'Session Numéro 2',
        type: null,
        startDate: getJsDateFromExcel(46368),
        endDate: savedSessions[1].endDate,
        environment: 'COURSE_TILT',
        trainees: [
          { email: 'bc-admin-0@yopmail.com', firstName: 'Admin', lastName: 'BC' },
          { email: 'test-formation@yopmail.com', firstName: 'Test', lastName: 'Formation' },
        ],
        professor: { email: 'bc-cr-admin-0@yopmail.com', firstName: 'Admin', lastName: 'CR' },
      },
    ])
  })

  it('imports a session without a professor and creates only trainee accounts', async () => {
    const [sessions, trainees, professors] = workbook
    jest.mocked(xlsx.parse).mockReturnValue([
      { ...sessions, data: sessions.data.slice(0, 2) },
      { ...trainees, data: [trainees.data[0], trainees.data[1], trainees.data[3]] },
      { ...professors, data: [] },
    ])
    mockCreateUsersWithAccount.mockResolvedValue({
      newUsers: { count: 2 },
      newAccounts: { count: 2 },
    })
    mockUpsertCourseSession
      .mockReset()
      .mockResolvedValueOnce(withParticipants({ ...savedSessions[0], professorOrganizationVersionId: null }))

    await expect(importCourseSessionsFromFTP()).resolves.toEqual({
      importedSessions: 1,
      modifiedSessions: 0,
      createdUsers: 2,
      createdAccounts: 2,
      addedTrainees: 2,
      addedProfessors: 0,
      deletedSessions: 0,
      deletedTrainees: 0,
      deletedProfessors: 0,
    })

    expect(mockCreateUsersWithAccount).toHaveBeenCalledWith([
      expect.objectContaining({ email: 'test.abc2@abc-transitionbascarbone.fr' }),
      expect.objectContaining({ email: 'test.abc@abc-transitionbascarbone.fr' }),
    ])
    expect(mockUpsertCourseSession).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ professorOrganizationVersionId: null }),
        update: expect.not.objectContaining({ professorOrganizationVersionId: expect.anything() }),
      }),
    )
    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledWith(
      'contact@example.org',
      'Partner A',
      [expect.objectContaining({ professor: null, trainees: expect.any(Array) })],
      [],
    )
  })

  it('keeps existing sessions, trainees and professor when they are absent from the FTP file', async () => {
    const previous = savedSessions.map(withParticipants)
    const [sessions, trainees, professors] = workbook
    jest.mocked(xlsx.parse).mockReturnValue([
      { ...sessions, data: sessions.data.slice(0, 2) },
      { ...trainees, data: trainees.data.slice(0, 2) },
      { ...professors, data: [] },
    ])
    mockFindCourseSessions.mockResolvedValueOnce(previous)
    mockUpsertCourseSession.mockReset().mockResolvedValueOnce(previous[0])

    await importCourseSessionsFromFTP()

    expect(mockUpsertCourseSession).toHaveBeenCalledTimes(1)
    const { update } = mockUpsertCourseSession.mock.calls[0][0]
    expect(update).not.toHaveProperty('professorOrganizationVersionId')
    expect(update.traineeOrganizations).toEqual({
      createMany: {
        data: [
          { organizationVersionId: 'organization-0', courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE },
        ],
        skipDuplicates: true,
      },
    })
    expect(mockSendCourseSessionsCreatedEmail).not.toHaveBeenCalled()
  })

  it('creates a personal organization for each account and links trainees and professors to their sessions', async () => {
    mockCreateUsersWithAccount.mockResolvedValue({
      newUsers: { count: 6 },
      newAccounts: { count: 6 },
    })
    const accountEntries = [
      ['test.abc2@abc-transitionbascarbone.fr', 'Test', 'ABC', 'COURSE_BC'],
      ['test.abc@abc-transitionbascarbone.fr', 'Test', 'ABC', 'COURSE_BC'],
      ['onboarding@yopmail.com', 'Onboarding', 'Yopmail', 'COURSE_BC'],
      ['bc-admin-0@yopmail.com', 'Admin', 'BC', 'COURSE_TILT'],
      ['test-formation@yopmail.com', 'Test', 'Formation', 'COURSE_TILT'],
      ['bc-cr-admin-0@yopmail.com', 'Admin', 'CR', 'COURSE_TILT'],
    ] as const
    mockFindAccounts.mockResolvedValue(
      accountEntries.map(([email, firstName, lastName, environment], index) => ({
        id: `account-${index}`,
        email,
        environment,
        organizationVersionId: null,
        user: { email, firstName, lastName },
      })) as never,
    )
    mockUpdateAccount.mockImplementation(async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      organizationVersionId: `organization-${where.id}`,
    }))
    mockFindCourseSessions.mockResolvedValue([])

    await importCourseSessionsFromFTP()

    expect(mockCreateUsersWithAccount).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'test.abc2@abc-transitionbascarbone.fr',
          firstName: 'Test',
          lastName: 'ABC',
        }),
      ]),
    )
    expect(mockUpdateAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'account-0' },
        data: {
          organizationVersion: {
            create: {
              environment: 'COURSE_BC',
              organization: { create: { name: 'Test ABC' } },
            },
          },
        },
      }),
    )
    expect(mockUpsertCourseSession).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          courseOrganismId_name_environment: {
            courseOrganismId: 'organism-1',
            name: 'Session Numéro 1',
            environment: 'COURSE_BC',
          },
        },
        create: expect.objectContaining({
          professorOrganizationVersionId: 'organization-account-2',
          traineeOrganizations: {
            create: [
              {
                organizationVersion: { connect: { id: 'organization-account-0' } },
                courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE,
              },
              {
                organizationVersion: { connect: { id: 'organization-account-1' } },
                courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE,
              },
            ],
          },
        }),
        update: expect.objectContaining({
          professorOrganizationVersionId: 'organization-account-2',
          traineeOrganizations: {
            createMany: {
              data: [
                {
                  organizationVersionId: 'organization-account-0',
                  courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE,
                },
                {
                  organizationVersionId: 'organization-account-1',
                  courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE,
                },
              ],
              skipDuplicates: true,
            },
          },
        }),
      }),
    )
  })

  it('preserves existing registrations and their statuses when importing participants again', async () => {
    mockFindCourseSessions.mockResolvedValueOnce(savedSessions.map(withParticipants))

    await importCourseSessionsFromFTP()

    expect(mockUpsertCourseSession.mock.calls[0][0].update.traineeOrganizations).toEqual({
      createMany: {
        data: [
          { organizationVersionId: 'organization-0', courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE },
          { organizationVersionId: 'organization-1', courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE },
        ],
        skipDuplicates: true,
      },
    })
  })

  it.each([
    ['2026-01-01T09:00:00.000Z', CourseSessionTraineeOrganizationStatus.INACTIVE],
    [savedSessions[0].startDate.toISOString(), CourseSessionTraineeOrganizationStatus.ACTIVE],
    [
      new Date(savedSessions[0].startDate.getTime() + 9 * 60 * 60 * 1000).toISOString(),
      CourseSessionTraineeOrganizationStatus.ACTIVE,
    ],
    [savedSessions[0].endDate.toISOString(), CourseSessionTraineeOrganizationStatus.ACTIVE],
  ])('initializes only new registrations at %s with status %s', async (date, courseStatus) => {
    jest.setSystemTime(new Date(date))

    await importCourseSessionsFromFTP()

    const { create, update } = mockUpsertCourseSession.mock.calls[0][0]
    expect(create.traineeOrganizations).toEqual({
      create: ['organization-0', 'organization-1'].map((id) => ({
        organizationVersion: { connect: { id } },
        courseStatus,
      })),
    })
    expect(update.traineeOrganizations).toEqual({
      createMany: {
        data: ['organization-0', 'organization-1'].map((organizationVersionId) => ({
          organizationVersionId,
          courseStatus,
        })),
        skipDuplicates: true,
      },
    })
  })

  it('rejects a professor who is also a trainee', () => {
    const [sessions, trainees, professors] = workbook
    jest.mocked(xlsx.parse).mockReturnValue([
      sessions,
      {
        ...trainees,
        data: [...trainees.data, ['Session Numéro 1', 'onboarding@yopmail.com', 'Onboarding', 'Yopmail']],
      },
      professors,
    ])

    expect(() => parseCourseSessionWorkbook(Buffer.from('xlsx content'), 'organism-1')).toThrow(
      'Professor is also a trainee in training session Session Numéro 1',
    )
  })

  it('sends a single email containing the saved codes and participants of all new sessions', async () => {
    await expect(importCourseSessionsFromFTP()).resolves.toEqual({
      importedSessions: 2,
      modifiedSessions: 0,
      createdUsers: 6,
      createdAccounts: 6,
      addedTrainees: 4,
      addedProfessors: 2,
      deletedSessions: 0,
      deletedTrainees: 0,
      deletedProfessors: 0,
    })

    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledTimes(1)
    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledWith(
      'contact@example.org',
      'Partner A',
      [
        expect.objectContaining({
          ...savedSessions[0],
          trainees: [
            { email: 'test.abc2@abc-transitionbascarbone.fr', firstName: 'Test', lastName: 'ABC' },
            { email: 'test.abc@abc-transitionbascarbone.fr', firstName: 'Test', lastName: 'ABC' },
          ],
          professor: { email: 'onboarding@yopmail.com', firstName: 'Onboarding', lastName: 'Yopmail' },
        }),
        expect.objectContaining({
          ...savedSessions[1],
          trainees: [
            { email: 'bc-admin-0@yopmail.com', firstName: 'Admin', lastName: 'BC' },
            { email: 'test-formation@yopmail.com', firstName: 'Test', lastName: 'Formation' },
          ],
        }),
      ],
      [],
    )
  })

  it('excludes existing sessions from the email', async () => {
    mockFindCourseSessions.mockResolvedValueOnce([withParticipants(savedSessions[0])])

    await importCourseSessionsFromFTP()

    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledTimes(1)
    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledWith(
      'contact@example.org',
      'Partner A',
      [expect.objectContaining({ id: 'session-2' })],
      [],
    )
  })

  it('does not send an email when all sessions already exist', async () => {
    mockFindCourseSessions.mockResolvedValueOnce(savedSessions.map(withParticipants))

    await importCourseSessionsFromFTP()

    expect(mockSendCourseSessionsCreatedEmail).not.toHaveBeenCalled()
  })

  it('keeps each organism sessions in a separate email', async () => {
    const firstOrganism = (await mockFindCourseOrganisms())[0]
    mockFindCourseOrganisms.mockResolvedValue([
      firstOrganism,
      { ...firstOrganism, id: 'organism-2', name: 'Partner B', contactEmail: 'partner-b@example.org' },
    ])
    mockUpsertCourseSession
      .mockResolvedValueOnce(withParticipants({ ...savedSessions[0], id: 'session-3', courseOrganismId: 'organism-2' }))
      .mockResolvedValueOnce(withParticipants({ ...savedSessions[1], id: 'session-4', courseOrganismId: 'organism-2' }))

    await importCourseSessionsFromFTP()

    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledTimes(2)
    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenNthCalledWith(
      1,
      'contact@example.org',
      'Partner A',
      [
        expect.objectContaining({ id: 'session-1', courseOrganismId: 'organism-1' }),
        expect.objectContaining({ id: 'session-2', courseOrganismId: 'organism-1' }),
      ],
      [],
    )
    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenNthCalledWith(
      2,
      'partner-b@example.org',
      'Partner B',
      [
        expect.objectContaining({ id: 'session-3', courseOrganismId: 'organism-2' }),
        expect.objectContaining({ id: 'session-4', courseOrganismId: 'organism-2' }),
      ],
      [],
    )
  })

  it('sends creations and date, professor and trainee changes in the same email', async () => {
    const before = withParticipants(savedSessions[0])
    const oldProfessor = { email: 'old-professor@example.org', firstName: 'Old', lastName: 'Professor' }
    const retainedTrainee = { email: 'retained@example.org', firstName: 'Retained', lastName: 'Trainee' }
    before.startDate = new Date('2026-01-01')
    before.endDate = new Date('2026-01-02')
    before.professorOrganization = { userAccounts: [{ user: oldProfessor }] }
    before.traineeOrganizations = [
      before.traineeOrganizations[0],
      { organizationVersion: { userAccounts: [{ user: retainedTrainee }] } },
    ]
    const after = withParticipants(savedSessions[0])
    after.traineeOrganizations.push({ organizationVersion: { userAccounts: [{ user: retainedTrainee }] } })
    mockUpsertCourseSession
      .mockReset()
      .mockResolvedValueOnce(after)
      .mockResolvedValueOnce(withParticipants(savedSessions[1]))
    mockFindCourseSessions.mockResolvedValueOnce([before])

    await expect(importCourseSessionsFromFTP()).resolves.toEqual({
      importedSessions: 1,
      modifiedSessions: 1,
      createdUsers: 6,
      createdAccounts: 6,
      addedTrainees: 3,
      addedProfessors: 2,
      deletedSessions: 0,
      deletedTrainees: 0,
      deletedProfessors: 0,
    })

    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledTimes(1)
    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledWith(
      'contact@example.org',
      'Partner A',
      [expect.objectContaining({ id: 'session-2' })],
      [
        {
          name: savedSessions[0].name,
          environment: savedSessions[0].environment,
          courseOrganismId: 'organism-1',
          startDate: savedSessions[0].startDate,
          dates: [
            { label: 'Date de début', before: before.startDate, after: savedSessions[0].startDate },
            { label: 'Date de fin', before: before.endDate, after: savedSessions[0].endDate },
          ],
          professor: {
            before: oldProfessor,
            after: withParticipants(savedSessions[0]).professorOrganization?.userAccounts[0].user,
          },
          addedTrainees: [{ email: 'test.abc@abc-transitionbascarbone.fr', firstName: 'Test', lastName: 'ABC' }],
          removedTrainees: [],
        },
      ],
    )
  })

  it.each(['startDate', 'endDate', 'professor', 'trainees'] as const)(
    'sends an update-only email when only %s changes',
    async (field) => {
      const previous = savedSessions.map(withParticipants)
      if (field === 'startDate' || field === 'endDate') {
        previous[0][field] = new Date('2026-01-01')
      } else if (field === 'professor') {
        previous[0].professorOrganization = null
      } else {
        previous[0].traineeOrganizations = []
      }
      mockFindCourseSessions.mockResolvedValueOnce(previous)

      await importCourseSessionsFromFTP()

      expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledTimes(1)
      expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledWith(
        'contact@example.org',
        'Partner A',
        [],
        [expect.objectContaining({ name: savedSessions[0].name })],
      )
    },
  )

  it('ignores trainee order changes', async () => {
    const previous = savedSessions.map(withParticipants)
    previous[0].traineeOrganizations.reverse()
    mockFindCourseSessions.mockResolvedValueOnce(previous)

    await importCourseSessionsFromFTP()

    expect(mockSendCourseSessionsCreatedEmail).not.toHaveBeenCalled()
  })

  it('does not send an email if saving the sessions fails', async () => {
    const error = new Error('Database unavailable')
    mockUpsertCourseSession.mockReset().mockRejectedValueOnce(error)

    await expect(importCourseSessionsFromFTP()).rejects.toThrow(error)

    expect(mockUpsertCourseSession).toHaveBeenCalledTimes(1)
    expect(mockSendCourseSessionsCreatedEmail).not.toHaveBeenCalled()
  })

  it('reports email failures after saving the sessions', async () => {
    const error = new Error('SMTP unavailable')
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    mockSendCourseSessionsCreatedEmail.mockRejectedValueOnce(error)

    try {
      await expect(importCourseSessionsFromFTP()).rejects.toThrow(error)
      expect(mockUpsertCourseSession).toHaveBeenCalledTimes(2)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending training sessions email:',
        { courseOrganismId: 'organism-1' },
        error,
      )
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('does not send an email when no sessions are imported', async () => {
    mockFindCourseOrganisms.mockResolvedValue([])

    await expect(importCourseSessionsFromFTP()).resolves.toEqual({
      importedSessions: 0,
      modifiedSessions: 0,
      createdUsers: 0,
      createdAccounts: 0,
      addedTrainees: 0,
      addedProfessors: 0,
      deletedSessions: 0,
      deletedTrainees: 0,
      deletedProfessors: 0,
    })
    expect(mockSendCourseSessionsCreatedEmail).not.toHaveBeenCalled()
  })

  it('rejects more than one professor for a session', () => {
    const [sessions, trainees, professors] = workbook
    jest.mocked(xlsx.parse).mockReturnValue([
      sessions,
      trainees,
      {
        ...professors,
        data: [...professors.data, ['Session Numéro 1', 'other@example.org', 'Other', 'Example']],
      },
    ])

    expect(() => parseCourseSessionWorkbook(Buffer.from('xlsx content'), 'organism-1')).toThrow(
      'Training session Session Numéro 1 must have exactly one professor',
    )
  })

  it('parses sessions without a professor', () => {
    const [sessions, trainees, professors] = workbook
    jest.mocked(xlsx.parse).mockReturnValue([
      sessions,
      trainees,
      {
        ...professors,
        data: [],
      },
    ])

    const { sessions: parsedSessions } = parseCourseSessionWorkbook(Buffer.from('xlsx content'), 'organism-1')

    expect(parsedSessions).toEqual([
      expect.objectContaining({ name: 'Session Numéro 1', professor: null }),
      expect.objectContaining({ name: 'Session Numéro 2', professor: null }),
    ])
  })

  it.each([
    [46277, 46278, 'Second'],
    [46278, 46277, 'First'],
    [undefined, 46277, 'Second'],
    [46277, undefined, 'First'],
    [undefined, undefined, 'Second'],
    [46277, 46277, 'Second'],
    ['2026-10-29T10:00:00Z', '2026-10-29T09:00:00Z', 'First'],
  ])('selects one session per trainee and type using dates %s and %s', (firstDate, secondDate, winner) => {
    jest.mocked(xlsx.parse).mockReturnValue([
      {
        name: 'Sessions',
        data: [
          ['Nom de la session', 'Date de début', 'Date de fin', 'Environment', 'Type de formation'],
          ['First', 46277, 46377, 'BC', ' m1 '],
          ['Second', 46277, 46377, 'BC', 'M1'],
          ['Other type', 46277, 46377, 'BC', 'M2'],
        ],
      },
      {
        name: 'Stagiaires',
        data: [
          ['Nom de la session', 'Email', 'Prénom', 'Nom', "Date d'ajout/modification de cette ligne"],
          ['First', ' TRAINEE@EXAMPLE.ORG ', 'First', 'Trainee', firstDate],
          ['Second', 'trainee@example.org', 'Second', 'Trainee', secondDate],
          ['Other type', 'trainee@example.org', 'Other', 'Trainee'],
        ],
      },
      { name: 'Formateur', data: [] },
    ])

    const { sessions } = parseCourseSessionWorkbook(Buffer.from('xlsx content'), 'organism-1')

    expect(sessions.map(({ name, trainees }) => ({ name, emails: trainees.map(({ email }) => email) }))).toEqual([
      { name: 'First', emails: winner === 'First' ? ['trainee@example.org'] : [] },
      { name: 'Second', emails: winner === 'Second' ? ['trainee@example.org'] : [] },
      { name: 'Other type', emails: ['trainee@example.org'] },
    ])
    expect(sessions.map(({ type }) => type)).toEqual(['M1', 'M1', 'M2'])
  })

  it.each([
    [46278, 46277, 'M1'],
    [46277, 46278, 'M2'],
    [undefined, undefined, 'M2'],
  ])('selects the most recent session definition, then the lowest row', (firstDate, secondDate, type) => {
    jest.mocked(xlsx.parse).mockReturnValue([
      {
        name: 'Sessions',
        data: [
          [
            'Nom de la session',
            'Date de début',
            'Date de fin',
            'Environment',
            'Type de formation',
            "Date d'ajout/modification de cette ligne",
          ],
          ['Session', 46277, 46377, 'BC', 'M1', firstDate],
          ['Session', 46277, 46377, 'BC', 'M2', secondDate],
        ],
      },
      { name: 'Stagiaires', data: [] },
      { name: 'Formateur', data: [] },
    ])

    expect(parseCourseSessionWorkbook(Buffer.from('xlsx content'), 'organism-1').sessions).toEqual([
      expect.objectContaining({ name: 'Session', type }),
    ])
  })

  it('rejects invalid modification dates instead of using row order', () => {
    jest.mocked(xlsx.parse).mockReturnValue([
      workbook[0],
      {
        name: 'Stagiaires',
        data: [
          ['Nom de la session', 'Email', 'Prénom', 'Nom', "Date d'ajout/modification de cette ligne"],
          ['Session Numéro 1', 'trainee@example.org', 'First', 'Trainee', 'invalid date'],
        ],
      },
      { name: 'Formateur', data: [] },
    ])

    expect(() => parseCourseSessionWorkbook(Buffer.from('xlsx content'), 'organism-1')).toThrow(
      "Invalid Date d'ajout/modification de cette ligne in training sessions file",
    )
  })

  it('moves an existing trainee from a conflicting session, including one absent from Excel', async () => {
    const current = savedSessions.map(withParticipants)
    const previous = { ...current[0], id: 'old-session', name: 'Old session' }
    const otherType = { ...previous, id: 'other-type', type: 'M2' }
    const otherOrganism = { ...previous, id: 'other-organism', courseOrganismId: 'organism-2' }
    const after = { ...previous, traineeOrganizations: [] }
    mockFindCourseSessions
      .mockResolvedValueOnce([previous, otherType, otherOrganism])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([...current, after, otherType, otherOrganism])
    mockDeleteTrainees.mockResolvedValueOnce({ count: 2 })
    mockCreateUsersWithAccount.mockResolvedValue({
      newUsers: { count: 0 },
      newAccounts: { count: 0 },
    })

    await expect(importCourseSessionsFromFTP()).resolves.toEqual({
      importedSessions: 2,
      modifiedSessions: 0,
      createdUsers: 0,
      createdAccounts: 0,
      addedTrainees: 4,
      addedProfessors: 2,
      deletedSessions: 0,
      deletedTrainees: 2,
      deletedProfessors: 0,
    })
    expect(mockDeleteTrainees).toHaveBeenCalledTimes(1)
    expect(mockDeleteTrainees).toHaveBeenCalledWith({
      where: {
        courseSessionId: 'old-session',
        organizationVersion: {
          userAccounts: {
            some: {
              user: {
                email: { in: ['test.abc2@abc-transitionbascarbone.fr', 'test.abc@abc-transitionbascarbone.fr'] },
              },
            },
          },
        },
      },
    })
    expect(mockUpsertCourseSession.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        create: expect.objectContaining({ type: 'M1' }),
        update: expect.objectContaining({ type: 'M1' }),
      }),
    )
    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledWith(
      'contact@example.org',
      'Partner A',
      expect.any(Array),
      [
        expect.objectContaining({
          name: 'Old session',
          removedTrainees: previous.traineeOrganizations.flatMap(({ organizationVersion }) =>
            organizationVersion.userAccounts.map(({ user }) => user),
          ),
        }),
      ],
    )
  })

  it('removes the losing registration when both sessions are present in Excel', async () => {
    jest.mocked(xlsx.parse).mockReturnValue([
      {
        name: 'Sessions',
        data: [
          ['Nom de la session', 'Date de début', 'Date de fin', 'Environment', 'Type de formation'],
          ['Session Numéro 1', 46277, 46377, 'BC', 'M1'],
          ['Session Numéro 2', 46368, 46508, 'BC', 'M1'],
        ],
      },
      {
        name: 'Stagiaires',
        data: [
          ['Nom de la session', 'Email', 'Prénom', 'Nom'],
          ['Session Numéro 1', 'test.abc2@abc-transitionbascarbone.fr', 'Test', 'ABC'],
          ['Session Numéro 2', 'test.abc2@abc-transitionbascarbone.fr', 'Test', 'ABC'],
        ],
      },
      { name: 'Formateur', data: [] },
    ])
    const first = withParticipants(savedSessions[0])
    const second = withParticipants({ ...savedSessions[1], environment: Environment.COURSE_BC, type: 'M1' })
    const before = { ...first, traineeOrganizations: second.traineeOrganizations }
    mockFindCourseSessions
      .mockResolvedValueOnce([before, { ...second, traineeOrganizations: [] }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([first, second])
    mockUpsertCourseSession.mockReset().mockResolvedValueOnce(first).mockResolvedValueOnce(second)
    mockDeleteTrainees.mockResolvedValueOnce({ count: 1 })
    mockCreateUsersWithAccount.mockResolvedValue({ newUsers: { count: 0 }, newAccounts: { count: 0 } })

    await expect(importCourseSessionsFromFTP()).resolves.toEqual({
      importedSessions: 0,
      modifiedSessions: 0,
      createdUsers: 0,
      createdAccounts: 0,
      addedTrainees: 1,
      addedProfessors: 0,
      deletedSessions: 0,
      deletedTrainees: 1,
      deletedProfessors: 0,
    })
    expect(mockDeleteTrainees).toHaveBeenCalledWith({
      where: {
        courseSessionId: first.id,
        organizationVersion: {
          userAccounts: { some: { user: { email: { in: ['test.abc2@abc-transitionbascarbone.fr'] } } } },
        },
      },
    })
    expect(mockUpsertCourseSession.mock.calls[0][0].update?.traineeOrganizations).toEqual({
      createMany: { data: [], skipDuplicates: true },
    })
    expect(mockFindCourseSessions).toHaveBeenNthCalledWith(1, {
      where: {
        OR: expect.arrayContaining([
          {
            courseOrganismId: 'organism-1',
            type: 'M1',
            traineeOrganizations: {
              some: {
                organizationVersion: {
                  userAccounts: { some: { user: { email: { in: ['test.abc2@abc-transitionbascarbone.fr'] } } } },
                },
              },
            },
          },
        ]),
      },
      select: expect.any(Object),
    })
  })

  it.each([
    [46277.75, 46377.5],
    [new Date('2026-09-12T18:00:00.000Z'), new Date('2026-12-21T12:00:00.000Z')],
    ['2026-09-12T18:00:00.000Z', '2026-12-21T12:00:00.000Z'],
    ['2026-10-28T18:00:00.000Z', '2026-10-28T09:00:00.000Z'],
  ])('normalizes session dates to the start and end of their UTC days for %s and %s', (startDate, endDate) => {
    jest.mocked(xlsx.parse).mockReturnValue([
      {
        name: 'Sessions',
        data: [
          ['Nom de la session', 'Date de début', 'Date de fin', 'Environment'],
          ['Session', startDate, endDate, 'BC'],
        ],
      },
      { name: 'Stagiaires', data: [] },
      { name: 'Formateur', data: [] },
    ])

    const {
      sessions: [session],
    } = parseCourseSessionWorkbook(Buffer.from('xlsx content'), 'organism-1')
    const expectedStart = typeof startDate === 'number' ? getJsDateFromExcel(startDate) : new Date(startDate)
    const expectedEnd = typeof endDate === 'number' ? getJsDateFromExcel(endDate) : new Date(endDate)
    expectedStart.setUTCHours(0, 0, 0, 0)
    expectedEnd.setUTCHours(23, 59, 59, 999)

    expect(session.startDate).toEqual(expectedStart)
    expect(session.endDate).toEqual(expectedEnd)
    if (startDate instanceof Date && endDate instanceof Date) {
      expect(startDate.getUTCHours()).toBe(18)
      expect(endDate.getUTCHours()).toBe(12)
    }
  })

  it('imports sessions throughout their final UTC day', async () => {
    jest.setSystemTime(savedSessions[1].endDate)
    mockUpsertCourseSession.mockReset().mockResolvedValueOnce(withParticipants(savedSessions[1]))

    await expect(importCourseSessionsFromFTP()).resolves.toEqual({
      importedSessions: 1,
      modifiedSessions: 0,
      createdUsers: 6,
      createdAccounts: 6,
      addedTrainees: 2,
      addedProfessors: 1,
      deletedSessions: 0,
      deletedTrainees: 0,
      deletedProfessors: 0,
    })
    expect(mockUpsertCourseSession).toHaveBeenCalledTimes(1)
  })

  it('accepts Email headers from the new template and normalizes deletion rows', () => {
    jest.mocked(xlsx.parse).mockReturnValue([
      workbook[0],
      ...workbook.slice(1).map((sheet) => ({
        ...sheet,
        data: [['Nom de la session', 'Email', 'Prénom', 'Nom'], ...sheet.data.slice(1)],
      })),
      {
        name: ' A supprimer ',
        data: [
          ['Type', 'Session', 'Email'],
          [' Stagiaire ', ' Session Numéro 1 ', ' TEST.ABC2@ABC-TRANSITIONBASCARBONE.FR '],
          ['Formateur', 'Session Numéro 1', 'onboarding@yopmail.com'],
          ['Session', 'Session Numéro 2'],
          [],
          [' ', '', ''],
        ],
      },
    ])

    const result = parseCourseSessionWorkbook(Buffer.from('xlsx content'), 'organism-1')

    expect(result).toEqual({
      sessions: [
        expect.objectContaining({
          name: 'Session Numéro 1',
          trainees: [{ email: 'test.abc@abc-transitionbascarbone.fr', firstName: 'Test', lastName: 'ABC' }],
          professor: null,
        }),
      ],
      deletions: [
        {
          courseOrganismId: 'organism-1',
          name: 'Session Numéro 1',
          type: 'stagiaire',
          email: 'test.abc2@abc-transitionbascarbone.fr',
        },
        {
          courseOrganismId: 'organism-1',
          name: 'Session Numéro 1',
          type: 'formateur',
          email: 'onboarding@yopmail.com',
        },
        { courseOrganismId: 'organism-1', name: 'Session Numéro 2', type: 'session' },
      ],
    })
  })

  it.each([
    [['Autre', 'Session Numéro 1', 'trainee@example.org'], 'Unsupported training deletion type: autre'],
    [['Stagiaire', 'Session Numéro 1'], 'Missing email in training sessions file'],
    [['Formateur', 'Session Numéro 1'], 'Missing email in training sessions file'],
    [['Session'], 'Missing Session in training sessions file'],
    [['', 'Session Numéro 1'], 'Missing Type in training sessions file'],
  ])('rejects invalid deletion row %j before any database mutation', async (row, message) => {
    jest
      .mocked(xlsx.parse)
      .mockReturnValue([...workbook, { name: 'A supprimer', data: [['Type', 'Session', 'Email'], row] }])
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      await expect(importCourseSessionsFromFTP()).rejects.toThrow(message)
      expect(mockCreateUsersWithAccount).not.toHaveBeenCalled()
      expect(prismaClient.$transaction).not.toHaveBeenCalled()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('removes only the requested trainee and professor links and emails the final state', async () => {
    const previous = savedSessions.map(withParticipants)
    const after = {
      ...previous[0],
      traineeOrganizations: previous[0].traineeOrganizations.slice(1),
      professorOrganization: null,
      professorOrganizationVersionId: null,
    }
    jest.mocked(xlsx.parse).mockReturnValue([
      ...workbook,
      {
        name: 'A supprimer',
        data: [
          ['Type', 'Session', 'Email'],
          ['Stagiaire', 'Session Numéro 1', 'test.abc2@abc-transitionbascarbone.fr'],
          ['Formateur', 'Session Numéro 1', 'onboarding@yopmail.com'],
        ],
      },
    ])
    mockFindCourseSessions
      .mockResolvedValueOnce(previous)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([after, previous[1]])
    mockUpsertCourseSession.mockReset().mockResolvedValueOnce(after).mockResolvedValueOnce(previous[1])
    mockDeleteTrainees.mockResolvedValueOnce({ count: 1 })
    mockUpdateCourseSessions.mockResolvedValueOnce({ count: 1 })

    await expect(importCourseSessionsFromFTP()).resolves.toEqual({
      importedSessions: 0,
      modifiedSessions: 0,
      createdUsers: 6,
      createdAccounts: 6,
      addedTrainees: 0,
      addedProfessors: 0,
      deletedSessions: 0,
      deletedTrainees: 1,
      deletedProfessors: 1,
    })

    expect(mockDeleteTrainees).toHaveBeenCalledWith({
      where: {
        courseSession: { courseOrganismId: 'organism-1', name: 'Session Numéro 1' },
        organizationVersion: {
          userAccounts: { some: { user: { email: 'test.abc2@abc-transitionbascarbone.fr' } } },
        },
      },
    })
    expect(mockUpdateCourseSessions).toHaveBeenCalledWith({
      where: {
        courseOrganismId: 'organism-1',
        name: 'Session Numéro 1',
        professorOrganization: { userAccounts: { some: { user: { email: 'onboarding@yopmail.com' } } } },
      },
      data: { professorOrganizationVersionId: null },
    })
    expect(mockDeleteCourseSessions).not.toHaveBeenCalled()
    const createdEmails = mockCreateUsersWithAccount.mock.calls[0][0].map(({ email }) => email)
    expect(createdEmails).not.toContain('test.abc2@abc-transitionbascarbone.fr')
    expect(createdEmails).not.toContain('onboarding@yopmail.com')
    expect(mockUpsertCourseSession.mock.calls[0][0].update).toEqual(
      expect.objectContaining({
        traineeOrganizations: {
          createMany: {
            data: [
              {
                organizationVersionId: 'organization-1',
                courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE,
              },
            ],
            skipDuplicates: true,
          },
        },
      }),
    )
    expect(mockUpsertCourseSession.mock.calls[0][0].update).not.toHaveProperty('professorOrganizationVersionId')
    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledWith(
      'contact@example.org',
      'Partner A',
      [],
      [
        expect.objectContaining({
          professor: { before: previous[0].professorOrganization?.userAccounts[0].user, after: null },
          removedTrainees: [{ email: 'test.abc2@abc-transitionbascarbone.fr', firstName: 'Test', lastName: 'ABC' }],
        }),
      ],
    )
  })

  it('deletes sessions in both environments without recreating them or their participants', async () => {
    mockDeleteCourseSessions.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 1 })
    jest.mocked(xlsx.parse).mockReturnValue([
      ...workbook,
      {
        name: 'A supprimer',
        data: [
          ['Type', 'Session', 'Email'],
          ['Session', 'Session Numéro 1'],
          ['Sessions', 'Session Numéro 2'],
        ],
      },
    ])

    await expect(importCourseSessionsFromFTP()).resolves.toEqual({
      importedSessions: 0,
      modifiedSessions: 0,
      createdUsers: 0,
      createdAccounts: 0,
      addedTrainees: 0,
      addedProfessors: 0,
      deletedSessions: 2,
      deletedTrainees: 0,
      deletedProfessors: 0,
    })

    expect(mockDeleteCourseSessions.mock.calls).toEqual([
      [{ where: { courseOrganismId: 'organism-1', name: 'Session Numéro 1' } }],
      [{ where: { courseOrganismId: 'organism-1', name: 'Session Numéro 2' } }],
    ])
    expect(mockCreateUsersWithAccount).not.toHaveBeenCalled()
    expect(mockFindAccounts).not.toHaveBeenCalled()
    expect(mockUpsertCourseSession).not.toHaveBeenCalled()
  })

  it('processes deletion-only files for ended sessions and does not notify twice', async () => {
    const before = withParticipants(savedSessions[0])
    const after = { ...before, traineeOrganizations: before.traineeOrganizations.slice(1) }
    jest.setSystemTime(new Date('2030-01-01'))
    jest.mocked(xlsx.parse).mockReturnValue([
      ...workbook.map((sheet) => ({ ...sheet, data: sheet.data.slice(0, 1) })),
      {
        name: 'A supprimer',
        data: [
          ['Type', 'Session', 'Email'],
          ['Stagiaire', before.name, 'test.abc2@abc-transitionbascarbone.fr'],
        ],
      },
    ])
    mockFindCourseSessions
      .mockResolvedValueOnce([before])
      .mockResolvedValueOnce([after])
      .mockResolvedValueOnce([after])
      .mockResolvedValueOnce([after])
    mockDeleteTrainees.mockResolvedValueOnce({ count: 1 })

    await expect(importCourseSessionsFromFTP()).resolves.toEqual({
      importedSessions: 0,
      modifiedSessions: 0,
      createdUsers: 0,
      createdAccounts: 0,
      addedTrainees: 0,
      addedProfessors: 0,
      deletedSessions: 0,
      deletedTrainees: 1,
      deletedProfessors: 0,
    })
    await importCourseSessionsFromFTP()

    expect(mockDeleteTrainees).toHaveBeenCalledTimes(2)
    expect(mockCreateUsersWithAccount).not.toHaveBeenCalled()
    expect(mockUpsertCourseSession).not.toHaveBeenCalled()
    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledTimes(1)
  })

  it('propagates deletion failures without importing or sending a success email', async () => {
    jest.mocked(xlsx.parse).mockReturnValue([
      ...workbook,
      {
        name: 'A supprimer',
        data: [
          ['Type', 'Session', 'Email'],
          ['Session', 'Session Numéro 1'],
        ],
      },
    ])
    mockDeleteCourseSessions.mockRejectedValueOnce(new Error('Deletion failed'))

    await expect(importCourseSessionsFromFTP()).rejects.toThrow('Deletion failed')

    expect(mockUpsertCourseSession).not.toHaveBeenCalled()
    expect(mockSendCourseSessionsCreatedEmail).not.toHaveBeenCalled()
  })

  afterAll(() => {
    consoleLogSpy.mockRestore()
  })
})
