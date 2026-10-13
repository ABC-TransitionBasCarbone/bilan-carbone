import { prismaClient } from '@/db/client.server'
import { createUsersWithAccount } from '@/db/user'
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

jest.mock('@/db/client.server', () => ({
  prismaClient: {
    courseOrganism: { findMany: jest.fn() },
    account: { findMany: jest.fn(), update: jest.fn() },
    courseSession: { findMany: jest.fn(), upsert: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/db/user', () => ({ createUsersWithAccount: jest.fn() }))

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
      ['Session Numéro 1', 'chloe.molle@abc-transitionbascarbone.fr', 'Test', 'ABC'],
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
          { email: 'chloe.molle@abc-transitionbascarbone.fr', firstName: 'Test', lastName: 'ABC' },
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

  afterAll(() => {
    consoleLogSpy.mockRestore()
  })
})
