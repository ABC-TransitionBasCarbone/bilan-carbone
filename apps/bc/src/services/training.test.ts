import { prismaClient } from '@/db/client.server'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import { Environment, Role, StudyRole } from '@abc-transitionbascarbone/common/db/enums'
import { deactivateCourseUser, deactivateExpiredCourseUsers } from './training'

jest.mock('@/db/client.server', () => ({
  prismaClient: {
    account: { findMany: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
    userOnStudy: { updateMany: jest.fn() },
    contributors: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

const expiredAccount = {
  id: 'trainee',
  environment: Environment.COURSE_BC,
  professorCourseSessions: [],
  traineeCourseSessions: [{ courseSession: { startDate: new Date('2026-01-01'), endDate: new Date('2026-01-10') } }],
}

const mockFindAccount = prismaClient.account.findUniqueOrThrow as jest.Mock
const mockFindAccounts = prismaClient.account.findMany as jest.Mock
const mockTransaction = prismaClient.$transaction as jest.Mock

describe('course user deactivation', () => {
  const originalDays = process.env.TRAINING_ACCESS_DAYS

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date('2026-02-01'))
    process.env.TRAINING_ACCESS_DAYS = '10'
    mockTransaction.mockImplementation(async (callback: (transaction: Prisma.TransactionClient) => Promise<unknown>) =>
      callback(prismaClient),
    )
    mockFindAccount.mockResolvedValue(expiredAccount)
  })

  afterEach(() => {
    jest.useRealTimers()
    if (originalDays === undefined) {
      delete process.env.TRAINING_ACCESS_DAYS
    } else {
      process.env.TRAINING_ACCESS_DAYS = originalDays
    }
  })

  it('downgrades the account and all direct study rights and removes contributor writes atomically', async () => {
    await deactivateCourseUser('trainee')
    expect(prismaClient.$transaction).toHaveBeenCalledTimes(1)
    expect(prismaClient.account.update).toHaveBeenCalledWith({ where: { id: 'trainee' }, data: { role: Role.DEFAULT } })
    expect(prismaClient.userOnStudy.updateMany).toHaveBeenCalledWith({
      where: { accountId: 'trainee', role: { not: StudyRole.Reader } },
      data: { role: StudyRole.Reader },
    })
    expect(prismaClient.contributors.deleteMany).toHaveBeenCalledWith({ where: { accountId: 'trainee' } })
  })

  it.each([Environment.BC, Environment.TILT])('refuses to downgrade a %s account', async (environment) => {
    mockFindAccount.mockResolvedValue({ ...expiredAccount, environment })
    await expect(deactivateCourseUser('trainee')).rejects.toThrow('not a trainee-only course account')
    expect(prismaClient.account.update).not.toHaveBeenCalled()
  })

  it('refuses to downgrade a professor who is also a trainee', async () => {
    mockFindAccount.mockResolvedValue({
      ...expiredAccount,
      professorCourseSessions: [{ id: 'course' }],
    })
    await expect(deactivateCourseUser('trainee')).rejects.toThrow('not a trainee-only course account')
    expect(prismaClient.account.update).not.toHaveBeenCalled()
  })

  it('deactivates expired trainees but not ongoing, future-only or professor accounts', async () => {
    mockFindAccounts.mockResolvedValue([
      expiredAccount,
      {
        ...expiredAccount,
        id: 'ongoing',
        traineeCourseSessions: [
          { courseSession: { startDate: new Date('2026-01-01'), endDate: new Date('2026-02-10') } },
        ],
      },
      {
        ...expiredAccount,
        id: 'future',
        traineeCourseSessions: [
          { courseSession: { startDate: new Date('2026-03-01'), endDate: new Date('2026-03-10') } },
        ],
      },
      { ...expiredAccount, id: 'professor', professorCourseSessions: [{ id: 'course' }] },
    ])
    await expect(deactivateExpiredCourseUsers()).resolves.toEqual({ deactivated: 1 })
    expect(prismaClient.account.update).toHaveBeenCalledTimes(1)
    expect(prismaClient.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          environment: { in: [Environment.COURSE_BC, Environment.COURSE_TILT] },
          professorCourseSessions: { none: {} },
        }),
      }),
    )
  })

  it('propagates persistence errors', async () => {
    const error = new Error('database unavailable')
    jest.mocked(prismaClient.account.update).mockRejectedValueOnce(error)
    await expect(deactivateCourseUser('trainee')).rejects.toBe(error)
  })
})
