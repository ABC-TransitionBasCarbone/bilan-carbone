import { prismaClient } from '@/db/client.server'
import { createUsersWithAccount } from '@/db/user'
import type { CourseSession } from '@abc-transitionbascarbone/common/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
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
  const courseSession = { findMany: jest.fn(), upsert: jest.fn() }
  const transaction = { account, courseSession }
  return {
    prismaClient: {
      courseOrganism,
      account,
      courseSession,
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
const mockCreateUsersWithAccount = jest.mocked(createUsersWithAccount)
const mockSendCourseSessionsCreatedEmail = jest.mocked(sendCourseSessionsCreatedEmail)
const savedSessions: CourseSession[] = [
  {
    id: 'session-1',
    courseOrganismId: 'organism-1',
    name: 'Session Numéro 1',
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
      ['Nom de la session ', 'Stagiaires', 'Prénom', 'Nom'],
      ['Session Numéro 1', 'test.abc2@abc-transitionbascarbone.fr', 'Test', 'ABC'],
      ['Session Numéro 2 ', 'bc-admin-0@yopmail.com', 'Admin', 'BC'],
      ['Session Numéro 1', 'test.abc@abc-transitionbascarbone.fr', 'Test', 'ABC'],
      ['Session Numéro 2 ', 'test-formation@yopmail.com', 'Test', 'Formation'],
    ],
  },
  {
    name: 'Formateur',
    data: [
      ['Nom de la session ', 'Formateur', 'Prénom', 'Nom'],
      ['Session Numéro 1', 'onboarding@yopmail.com', 'Onboarding', 'Yopmail'],
      ['Session Numéro 2 ', 'bc-cr-admin-0@yopmail.com', 'Admin', 'CR'],
    ],
  },
]

const withParticipants = (session: CourseSession) => {
  const participants = parseCourseSessionWorkbook(Buffer.from('xlsx content'), session.courseOrganismId)
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
    const sessions = await getCourseSessionsFromFTP()
    const ftpClient = jest.mocked(Client).mock.results[0].value

    expect(ftpClient.access).toHaveBeenCalledWith({ host: 'host', user: 'user', password: 'password', port: 21 })
    expect(ftpClient.downloadTo).toHaveBeenCalledWith(expect.anything(), '/training/partner-a/sessions.xlsx')
    expect(fs.promises.readFile).toHaveBeenCalledWith('sessions.xlsx')
    expect(xlsx.parse).toHaveBeenCalledWith(Buffer.from('xlsx content'))
    expect(ftpClient.close).toHaveBeenCalledTimes(1)
    expect(sessions).toEqual([
      {
        courseOrganismId: 'organism-1',
        name: 'Session Numéro 1',
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
      createdUsers: 2,
      createdAccounts: 2,
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
        data: [{ organizationVersionId: 'organization-0' }],
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
              { organizationVersion: { connect: { id: 'organization-account-0' } } },
              { organizationVersion: { connect: { id: 'organization-account-1' } } },
            ],
          },
        }),
        update: expect.objectContaining({
          professorOrganizationVersionId: 'organization-account-2',
          traineeOrganizations: {
            createMany: {
              data: [
                { organizationVersionId: 'organization-account-0' },
                { organizationVersionId: 'organization-account-1' },
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
        data: [{ organizationVersionId: 'organization-0' }, { organizationVersionId: 'organization-1' }],
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
    await importCourseSessionsFromFTP()

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

    await importCourseSessionsFromFTP()

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
      createdUsers: 0,
      createdAccounts: 0,
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

    const parsedSessions = parseCourseSessionWorkbook(Buffer.from('xlsx content'), 'organism-1')

    expect(parsedSessions).toEqual([
      expect.objectContaining({ name: 'Session Numéro 1', professor: null }),
      expect.objectContaining({ name: 'Session Numéro 2', professor: null }),
    ])
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

    const [session] = parseCourseSessionWorkbook(Buffer.from('xlsx content'), 'organism-1')
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
      createdUsers: 6,
      createdAccounts: 6,
    })
    expect(mockUpsertCourseSession).toHaveBeenCalledTimes(1)
  })

  afterAll(() => {
    consoleLogSpy.mockRestore()
  })
})
