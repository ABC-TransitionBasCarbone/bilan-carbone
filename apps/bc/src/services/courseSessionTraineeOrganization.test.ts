import { prismaClient } from '@/db/client.server'
import { CourseSessionTraineeOrganizationStatus } from '@abc-transitionbascarbone/common/db/enums'
import { updateCourseSessionTraineeOrganizationStatuses } from './courseSessionTraineeOrganization'

jest.mock('@/db/client.server', () => {
  const courseSessionTraineeOrganization = { updateMany: jest.fn(), deleteMany: jest.fn() }
  const transaction = { courseSessionTraineeOrganization }
  return {
    prismaClient: {
      $transaction: jest.fn((operation) => operation(transaction)),
      courseSessionTraineeOrganization,
    },
  }
})

const mockUpdateMany = jest.mocked(prismaClient.courseSessionTraineeOrganization.updateMany)
const mockDeleteMany = jest.mocked(prismaClient.courseSessionTraineeOrganization.deleteMany)

describe('updateCourseSessionTraineeOrganizationStatuses', () => {
  const previousAccessDays = process.env.COURSE_SESSION_ACCESS_DAYS
  const now = new Date('2026-10-27T03:00:00.000Z')

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now)
    process.env.COURSE_SESSION_ACCESS_DAYS = '7'
    mockUpdateMany.mockReset().mockResolvedValue({ count: 2 } as never)
    mockDeleteMany.mockReset().mockResolvedValue({ count: 1 })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  afterAll(() => {
    if (previousAccessDays === undefined) {
      delete process.env.COURSE_SESSION_ACCESS_DAYS
    } else {
      process.env.COURSE_SESSION_ACCESS_DAYS = previousAccessDays
    }
  })

  it('activates started sessions within the access period and deactivates future or expired ones', async () => {
    await expect(updateCourseSessionTraineeOrganizationStatuses()).resolves.toEqual({
      activated: 2,
      deactivated: 2,
    })

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: {
        courseSession: { endDate: { lt: new Date('2026-10-27T00:00:00.000Z') } },
        organizationVersion: {
          userAccounts: { none: { createdStudies: { some: {} } } },
        },
      },
    })
    expect(mockDeleteMany.mock.invocationCallOrder[0]).toBeLessThan(mockUpdateMany.mock.invocationCallOrder[0])

    expect(mockUpdateMany).toHaveBeenNthCalledWith(1, {
      where: {
        courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE,
        courseSession: {
          startDate: { lte: new Date('2026-10-27T00:00:00.000Z') },
          endDate: { gte: new Date('2026-10-20T00:00:00.000Z') },
        },
      },
      data: { courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE },
    })
    expect(mockUpdateMany).toHaveBeenNthCalledWith(2, {
      where: {
        courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE,
        OR: [
          { courseSession: { startDate: { gt: new Date('2026-10-27T00:00:00.000Z') } } },
          { courseSession: { endDate: { lt: new Date('2026-10-20T00:00:00.000Z') } } },
        ],
      },
      data: { courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE },
    })
  })

  it.each(['2026-03-01T00:00:00.000Z', '2026-03-01T23:59:59.999Z'])(
    'uses the same UTC day boundaries at %s, including across month boundaries',
    async (date) => {
      jest.setSystemTime(new Date(date))
      process.env.COURSE_SESSION_ACCESS_DAYS = '2'

      await updateCourseSessionTraineeOrganizationStatuses()

      expect(mockDeleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            courseSession: { endDate: { lt: new Date('2026-03-01T00:00:00.000Z') } },
          }),
        }),
      )
      expect(mockUpdateMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            courseSession: {
              startDate: { lte: new Date('2026-03-01T00:00:00.000Z') },
              endDate: { gte: new Date('2026-02-27T00:00:00.000Z') },
            },
          }),
        }),
      )
      expect(mockUpdateMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { courseSession: { startDate: { gt: new Date('2026-03-01T00:00:00.000Z') } } },
              { courseSession: { endDate: { lt: new Date('2026-02-27T00:00:00.000Z') } } },
            ],
          }),
        }),
      )
    },
  )

  it('keeps the whole final day accessible when the access duration is zero', async () => {
    process.env.COURSE_SESSION_ACCESS_DAYS = '0'

    await updateCourseSessionTraineeOrganizationStatuses()

    expect(mockUpdateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          courseSession: {
            startDate: { lte: new Date('2026-10-27T00:00:00.000Z') },
            endDate: { gte: new Date('2026-10-27T00:00:00.000Z') },
          },
        }),
      }),
    )
  })

  it('rejects an invalid access duration', async () => {
    process.env.COURSE_SESSION_ACCESS_DAYS = '-1'

    await expect(updateCourseSessionTraineeOrganizationStatuses()).rejects.toThrow(
      'COURSE_SESSION_ACCESS_DAYS must be a non-negative integer',
    )
    expect(mockUpdateMany).not.toHaveBeenCalled()
    expect(mockDeleteMany).not.toHaveBeenCalled()
  })
})
