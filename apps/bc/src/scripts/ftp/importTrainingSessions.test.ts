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
const mockUpdateAccount = jest.mocked(prismaClient.account.update)
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
    endDate: getJsDateFromExcel(46377),
    traineeCode: '12345678',
    professorCode: '87654321',
    professorId: 'account-2',
    createdAt: new Date('2026-10-15'),
    updatedAt: new Date('2026-10-15'),
  },
  {
    id: 'session-2',
    courseOrganismId: 'organism-1',
    name: 'Session Numéro 2',
    environment: Environment.COURSE_TILT,
    startDate: getJsDateFromExcel(46368),
    endDate: getJsDateFromExcel(46508),
    traineeCode: '23456789',
    professorCode: '98765432',
    professorId: 'account-5',
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
    trainees: importedSession.trainees.map((user) => ({ account: { user } })),
    professor: importedSession.professor ? { user: importedSession.professor } : null,
  }
}

describe('getCourseSessionsFromFTP', () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

  beforeEach(() => {
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
    mockFindAccounts.mockResolvedValue([])
    mockFindCourseSessions.mockReset().mockResolvedValue([])
    mockUpsertCourseSession
      .mockReset()
      .mockResolvedValueOnce(withParticipants(savedSessions[0]))
      .mockResolvedValueOnce(withParticipants(savedSessions[1]))
    mockSendCourseSessionsCreatedEmail.mockReset()
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
        endDate: getJsDateFromExcel(46377),
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
        endDate: getJsDateFromExcel(46508),
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
      .mockResolvedValueOnce(withParticipants({ ...savedSessions[0], professorId: null }))

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
        create: expect.objectContaining({ professorId: null }),
        update: expect.objectContaining({ professorId: null }),
      }),
    )
    expect(mockSendCourseSessionsCreatedEmail).toHaveBeenCalledWith(
      'contact@example.org',
      'Partner A',
      [expect.objectContaining({ professor: null, trainees: expect.any(Array) })],
      [],
    )
  })

  it('creates a personal organization for each account and links trainees to their sessions', async () => {
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
          trainees: {
            create: [{ account: { connect: { id: 'account-0' } } }, { account: { connect: { id: 'account-1' } } }],
          },
        }),
        update: expect.objectContaining({
          trainees: {
            deleteMany: {},
            create: [{ account: { connect: { id: 'account-0' } } }, { account: { connect: { id: 'account-1' } } }],
          },
        }),
      }),
    )
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
    const removedTrainee = { email: 'removed@example.org', firstName: 'Removed', lastName: 'Trainee' }
    before.startDate = new Date('2026-01-01')
    before.endDate = new Date('2026-01-02')
    before.professor = { user: oldProfessor }
    before.trainees = [before.trainees[0], { account: { user: removedTrainee } }]
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
            after: withParticipants(savedSessions[0]).professor?.user,
          },
          addedTrainees: [{ email: 'test.abc@abc-transitionbascarbone.fr', firstName: 'Test', lastName: 'ABC' }],
          removedTrainees: [removedTrainee],
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
        previous[0].professor = null
      } else {
        previous[0].trainees = []
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
    previous[0].trainees.reverse()
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

  afterAll(() => {
    consoleLogSpy.mockRestore()
  })
})
