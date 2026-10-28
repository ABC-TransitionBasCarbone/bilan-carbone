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
        courseSession: { endDate: { lte: now } },
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
          startDate: { lte: now },
          endDate: { gt: new Date('2026-10-20T03:00:00.000Z') },
        },
      },
      data: { courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE },
    })
    expect(mockUpdateMany).toHaveBeenNthCalledWith(2, {
      where: {
        courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE,
        OR: [
          { courseSession: { startDate: { gt: now } } },
          { courseSession: { endDate: { lte: new Date('2026-10-20T03:00:00.000Z') } } },
        ],
      },
      data: { courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE },
    })
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
