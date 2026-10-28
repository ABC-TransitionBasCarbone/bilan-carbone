import { prismaClient } from '@/db/client.server'
import { CourseSessionTraineeOrganizationStatus } from '@abc-transitionbascarbone/common/db/enums'

const getCourseSessionAccessDays = () => {
  const value = process.env.COURSE_SESSION_ACCESS_DAYS
  const days = Number(value)
  if (!value?.trim() || !Number.isSafeInteger(days) || days < 0) {
    throw new Error('COURSE_SESSION_ACCESS_DAYS must be a non-negative integer')
  }
  return days
}

export const updateCourseSessionTraineeOrganizationStatuses = async () => {
  const accessDays = getCourseSessionAccessDays()

  const now = new Date()
  const endAccessDate = new Date()
  endAccessDate.setUTCDate(now.getUTCDate() - accessDays)

  return prismaClient.$transaction(async (transaction) => {
    await transaction.courseSessionTraineeOrganization.deleteMany({
      where: {
        courseSession: { endDate: { lte: now } },
        organizationVersion: {
          userAccounts: { none: { createdStudies: { some: {} } } },
        },
      },
    })

    const activated = await transaction.courseSessionTraineeOrganization.updateMany({
      where: {
        courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE,
        courseSession: {
          startDate: { lte: now },
          endDate: { gt: endAccessDate },
        },
      },
      data: { courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE },
    })

    const deactivated = await transaction.courseSessionTraineeOrganization.updateMany({
      where: {
        courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE,
        OR: [{ courseSession: { startDate: { gt: now } } }, { courseSession: { endDate: { lte: endAccessDate } } }],
      },
      data: { courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE },
    })

    return { activated: activated.count, deactivated: deactivated.count }
  })
}
