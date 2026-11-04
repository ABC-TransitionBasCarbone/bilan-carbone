import { getAccountById } from '@/db/account'
import { getCourseSessionForProfessor } from '@/db/courseSession'
import { UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { isCourseEnvironment } from '@abc-transitionbascarbone/common/utils/environments'
import { UserSession } from 'next-auth'

export const canManageCourseSession = async (user: UserSession, courseSessionId: string) => {
  if (!user.organizationVersionId || !isCourseEnvironment(user.environment)) {
    return false
  }

  const account = await getAccountById(user.accountId)

  return (
    account?.status !== UserStatus.SUSPENDED &&
    !!(await getCourseSessionForProfessor(user.organizationVersionId, user.environment, courseSessionId))
  )
}
