import { prismaClient } from '@/db/client.node'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import fs from 'fs'
import xlsx from 'node-xlsx'
import { getTrainingSessionsFromFTP } from './importTrainingSessions'

const accessMock = jest.fn()
const downloadToMock = jest.fn()
const closeMock = jest.fn()

jest.mock('@/db/client.node', () => ({
  prismaClient: {
    courseOrganism: { findMany: jest.fn() },
    courseSession: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  },
}))

jest.mock('basic-ftp', () => ({
  Client: jest.fn(() => ({
    access: accessMock,
    downloadTo: downloadToMock,
    close: closeMock,
  })),
}))

jest.mock('fs', () => {
  const mockedFs = {
    createWriteStream: jest.fn(),
    promises: {
      readFile: jest.fn(),
    },
  }

  return {
    __esModule: true,
    default: mockedFs,
    ...mockedFs,
  }
})

jest.mock('node-xlsx', () => ({
  __esModule: true,
  default: {
    parse: jest.fn(),
  },
}))

describe('getTrainingSessionsFromFTP', () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  const headers = ['Nom de la session', 'Date de début', 'Date de fin', 'Stagiaires', 'Environment']

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.FTP_HOST = 'host'
    process.env.FTP_USER = 'user'
    process.env.FTP_PASSWORD = 'password'
    process.env.FTP_PORT = '21'
    jest.mocked(prismaClient.courseOrganism.findMany).mockResolvedValue([
      {
        id: 'organism-id',
        name: 'Organism',
        contactEmail: 'contact@example.com',
        ftpPath: 'organism',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    jest.mocked(prismaClient.courseSession.findFirst).mockResolvedValue(null)
    jest.mocked(fs.promises.readFile).mockResolvedValue(Buffer.from('xlsx content'))
    jest.mocked(xlsx.parse).mockReturnValue([
      {
        name: 'Sessions',
        data: [
          headers,
          [' BC session ', 46037, 46038, '', 'BC'],
          ['TILT session', 46037, 46038, '', 'COURSE_TILT'],
          [],
          ['', '', '', '', ''],
        ],
      },
      { name: 'Liste', data: [['Nom de Formation'], ['Formation 1'], ['Formation 2']] },
    ])
    process.env.FTP_TRAINING_SESSIONS_FILE_PATH = '/training/'
    process.env.FTP_TRAINING_SESSIONS_FILE_NAME = 'sessions.xlsx'
  })

  it('reads the training sessions file and confirms success', async () => {
    await getTrainingSessionsFromFTP()

    expect(accessMock).toHaveBeenCalledWith({
      host: 'host',
      user: 'user',
      password: 'password',
      port: 21,
    })
    expect(downloadToMock).toHaveBeenCalledWith(undefined, '/training//organism/sessions.xlsx')
    expect(fs.promises.readFile).toHaveBeenCalledWith('sessions.xlsx')
    expect(xlsx.parse).toHaveBeenCalledWith(Buffer.from('xlsx content'))
    expect(closeMock).toHaveBeenCalledTimes(1)
    expect(prismaClient.courseSession.create).toHaveBeenCalledTimes(2)
    expect(prismaClient.courseSession.create).toHaveBeenNthCalledWith(1, {
      data: {
        startDate: new Date('2026-01-15T00:00:00.000Z'),
        endDate: new Date('2026-01-16T00:00:00.000Z'),
        courseOrganism: { connect: { id: 'organism-id' } },
        organizationVersion: {
          create: { environment: Environment.COURSE_BC, organization: { create: { name: 'BC session' } } },
        },
        sessionCode: { create: { traineeCode: expect.any(String), professorCode: expect.any(String) } },
      },
    })
    expect(prismaClient.courseSession.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        organizationVersion: {
          create: { environment: Environment.COURSE_TILT, organization: { create: { name: 'TILT session' } } },
        },
      }),
    })
    expect(consoleLogSpy).toHaveBeenCalledWith('Training sessions file read successfully')
  })

  it('updates existing sessions without recreating organizations or codes', async () => {
    jest.mocked(prismaClient.courseSession.findFirst).mockResolvedValue({
      id: 'session-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      startDate: new Date(),
      endDate: new Date(),
      courseOrganismId: 'organism-id',
      organizationVersionId: 'version-id',
      sessionCodeId: 'code-id',
    })

    await getTrainingSessionsFromFTP()

    expect(prismaClient.courseSession.create).not.toHaveBeenCalled()
    expect(prismaClient.courseSession.update).toHaveBeenCalledWith({
      where: { id: 'session-id' },
      data: { startDate: new Date('2026-01-15T00:00:00.000Z'), endDate: new Date('2026-01-16T00:00:00.000Z') },
    })
    expect(prismaClient.courseSession.findFirst).toHaveBeenCalledWith({
      where: {
        courseOrganismId: 'organism-id',
        organizationVersion: { environment: Environment.COURSE_BC, organization: { name: 'BC session' } },
      },
      select: { id: true },
    })
  })

  it('accepts Date and ISO date cells and ignores unmapped columns', async () => {
    jest.mocked(xlsx.parse).mockReturnValue([
      {
        name: 'Sessions',
        data: [
          [...headers, 'Extra column'],
          ['Session', new Date('2026-01-15T00:00:00.000Z'), '2026-01-16T00:00:00.000Z', '', 'BC', 'ignored'],
        ],
      },
    ])

    await getTrainingSessionsFromFTP()

    expect(prismaClient.courseSession.create).toHaveBeenCalledTimes(1)
    expect(prismaClient.courseSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        startDate: new Date('2026-01-15T00:00:00.000Z'),
        endDate: new Date('2026-01-16T00:00:00.000Z'),
      }),
    })
  })

  it.each([
    ['missing name', ['', 46037, 46038, '', 'BC']],
    ['invalid environment', ['Session', 46037, 46038, '', 'MIP']],
    ['invalid date', ['Session', 'invalid', 46038, '', 'BC']],
    ['missing start date', ['Session', undefined, 46038, '', 'BC']],
    ['missing end date', ['Session', 46037, null, '', 'BC']],
    ['invalid Date object', ['Session', new Date('invalid'), 46038, '', 'BC']],
    ['reversed dates', ['Session', 46038, 46037, '', 'BC']],
  ])('rejects a row with %s before writing sessions', async (_reason, row) => {
    jest
      .mocked(xlsx.parse)
      .mockReturnValue([{ name: 'Sessions', data: [headers, ['Valid session', 46037, 46038, '', 'BC'], row] }])

    await expect(getTrainingSessionsFromFTP()).rejects.toThrow('Invalid training session')

    expect(prismaClient.courseSession.create).not.toHaveBeenCalled()
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  it('awaits database writes and propagates their failures', async () => {
    jest.mocked(prismaClient.courseSession.create).mockRejectedValueOnce(new Error('Database failure'))

    await expect(getTrainingSessionsFromFTP()).rejects.toThrow('Database failure')

    expect(consoleLogSpy).not.toHaveBeenCalledWith('Training sessions file read successfully')
    expect(closeMock).toHaveBeenCalledTimes(1)
  })

  afterAll(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })
})
