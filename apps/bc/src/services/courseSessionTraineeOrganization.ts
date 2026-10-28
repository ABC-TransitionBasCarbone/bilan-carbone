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
    const activated = await transaction.courseSessionTraineeOrganization.updateMany({
      where: {
        courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE,
        courseSession: {
          startDate: { gte: now },
          endDate: { lt: endAccessDate },
        },
      },
      data: { courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE },
    })

    const deactivated = await transaction.courseSessionTraineeOrganization.updateMany({
      where: {
        courseStatus: CourseSessionTraineeOrganizationStatus.ACTIVE,
        OR: [{ courseSession: { startDate: { lt: now } } }, { courseSession: { endDate: { gte: endAccessDate } } }],
      },
      data: { courseStatus: CourseSessionTraineeOrganizationStatus.INACTIVE },
    })

    return { activated: activated.count, deactivated: deactivated.count }
  })
}
