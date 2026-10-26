import { getAccountListWithCourseInfoForAllTraineeNotDeactivated, NotDeactivatedTraineeAccountList } from '@/db/account'
import { prismaClient } from '@/db/client.server'
import { CourseAccountSelect } from '@/db/training.select'
import { getCourseAccess, getTrainingAccessDays, hasCourseAccess } from '@/utils/training'
import { Role, StudyRole } from '@abc-transitionbascarbone/common/db/enums'
import { isCourseEnvironment } from '@abc-transitionbascarbone/common/utils/environments'

export const deactivateCourseUser = async (account: NotDeactivatedTraineeAccountList[number]) =>
  prismaClient.$transaction(async (transaction) => {
    const accountId = account.id
    const courseAccess = getCourseAccess(account)
    if (
      !hasCourseAccess(courseAccess) &&
      courseAccess.periods.some(({ expiresAt }) => new Date(expiresAt) <= new Date())
    ) {
      const account = await transaction.account.findUniqueOrThrow({
        where: { id: accountId },
        select: { environment: true, ...CourseAccountSelect },
      })
      if (!isCourseEnvironment(account.environment) || account.professorCourseSessions.length > 0) {
        throw new Error(`deactivateCourseUser: account ${accountId} is not a trainee-only course account`)
      }
      await transaction.account.update({ where: { id: accountId }, data: { role: Role.DEFAULT } })
      await transaction.userOnStudy.updateMany({
        where: { accountId, role: { not: StudyRole.Reader } },
        data: { role: StudyRole.Reader },
      })
      await transaction.contributors.deleteMany({ where: { accountId } })
    }
  })

export const deactivateExpiredCourseUsers = async () => {
  getTrainingAccessDays()
  const accounts = await getAccountListWithCourseInfoForAllTraineeNotDeactivated()
  let deactivated = 0
  for (const account of accounts) {
    await deactivateCourseUser(account)
    deactivated++
  }
  return { deactivated }
}
