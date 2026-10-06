import { prismaClient } from '@/db/client.node'
import { CourseSession, Prisma, User } from '@abc-transitionbascarbone/db-common'
import { Environment, Role, UserSource, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import fs from 'fs'
import xlsx from 'node-xlsx'
import { getTrainingSessionsFromFTP } from './importTrainingSessions'

const accessMock = jest.fn()
const downloadToMock = jest.fn()
const closeMock = jest.fn()

jest.mock('@/db/client.node', () => ({
  prismaClient: {
    $transaction: jest.fn(async (operation: (transaction: Prisma.TransactionClient) => Promise<unknown>) =>
      operation(prismaClient),
    ),
    courseOrganism: { findMany: jest.fn() },
    courseSession: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    user: { upsert: jest.fn() },
    account: { upsert: jest.fn() },
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
  const courseSession: CourseSession = {
    id: 'session-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    startDate: new Date(),
    endDate: new Date(),
    courseOrganismId: 'organism-id',
    organizationVersionId: 'version-id',
    sessionCodeId: 'code-id',
  }
  const user: User = {
    id: 'user-id',
    email: 'trainee@example.com',
    firstName: 'Existing',
    lastName: 'Trainee',
    level: null,
    password: null,
    resetToken: null,
    source: UserSource.CRON,
    formationFormStartTime: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

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
    jest.mocked(prismaClient.courseSession.create).mockResolvedValue(courseSession)
    jest.mocked(prismaClient.courseSession.update).mockResolvedValue(courseSession)
    jest.mocked(prismaClient.user.upsert).mockResolvedValue(user)
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
        sessionCode: {
          create: {
            traineeCode: expect.stringMatching(/^\d{1,8}$/),
            professorCode: expect.stringMatching(/^\d{1,8}$/),
          },
        },
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
      select: { id: true, organizationVersionId: true },
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

  it.each([false, true])('imports deduplicated trainees when the session already exists: %s', async (exists) => {
    jest.mocked(prismaClient.courseSession.findFirst).mockResolvedValue(exists ? courseSession : null)
    jest.mocked(xlsx.parse).mockReturnValue([
      {
        name: 'Sessions',
        data: [
          headers,
          ['Session', 46037, 46038, ' Trainee@Example.com; second@example.com, trainee@example.com\n', 'BC'],
        ],
      },
    ])

    await getTrainingSessionsFromFTP()

    expect(prismaClient.user.upsert).toHaveBeenCalledTimes(2)
    expect(prismaClient.user.upsert).toHaveBeenNthCalledWith(1, {
      where: { email: 'trainee@example.com' },
      create: { email: 'trainee@example.com', firstName: '', lastName: '' },
      update: {},
      select: { id: true },
    })
    expect(prismaClient.user.upsert).toHaveBeenNthCalledWith(2, {
      where: { email: 'second@example.com' },
      create: { email: 'second@example.com', firstName: '', lastName: '' },
      update: {},
      select: { id: true },
    })
    expect(prismaClient.account.upsert).toHaveBeenCalledTimes(2)
    expect(prismaClient.account.upsert).toHaveBeenCalledWith({
      where: { userId_environment: { userId: 'user-id', environment: Environment.COURSE_BC } },
      create: {
        organizationVersionId: 'version-id',
        userId: 'user-id',
        environment: Environment.COURSE_BC,
        role: Role.COLLABORATOR,
        status: UserStatus.IMPORTED,
      },
      update: {},
    })
  })

  it('creates the trainee account in the TILT course environment', async () => {
    jest
      .mocked(xlsx.parse)
      .mockReturnValue([
        { name: 'Sessions', data: [headers, ['Session', 46037, 46038, 'trainee@example.com', 'TILT']] },
      ])

    await getTrainingSessionsFromFTP()

    expect(prismaClient.account.upsert).toHaveBeenCalledWith({
      where: { userId_environment: { userId: 'user-id', environment: Environment.COURSE_TILT } },
      create: {
        organizationVersionId: 'version-id',
        userId: 'user-id',
        environment: Environment.COURSE_TILT,
        role: Role.COLLABORATOR,
        status: UserStatus.IMPORTED,
      },
      update: {},
    })
  })

  it('logs and skips invalid emails while importing valid trainees and all sessions', async () => {
    jest.mocked(xlsx.parse).mockReturnValue([
      {
        name: 'Sessions',
        data: [
          headers,
          ['Valid session', 46037, 46038, 'trainee@example.com; invalid-email', 'BC'],
          ['Invalid session', 46037, 46038, 'invalid-email', 'BC'],
        ],
      },
    ])

    await getTrainingSessionsFromFTP()

    expect(consoleErrorSpy).toHaveBeenCalledWith('incorrect email for of training session:', 'Valid session')
    expect(consoleErrorSpy).toHaveBeenCalledWith('incorrect email for of training session:', 'Invalid session')
    expect(prismaClient.courseSession.create).toHaveBeenCalledTimes(2)
    expect(prismaClient.user.upsert).toHaveBeenCalledTimes(1)
    expect(prismaClient.user.upsert).toHaveBeenCalledWith({
      where: { email: 'trainee@example.com' },
      create: { email: 'trainee@example.com', firstName: '', lastName: '' },
      update: {},
      select: { id: true },
    })
    expect(prismaClient.account.upsert).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledWith('Training sessions file read successfully')
  })

  it('does not create users or accounts when there are no trainee emails', async () => {
    await getTrainingSessionsFromFTP()

    expect(prismaClient.user.upsert).not.toHaveBeenCalled()
    expect(prismaClient.account.upsert).not.toHaveBeenCalled()
  })

  afterAll(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })
})
