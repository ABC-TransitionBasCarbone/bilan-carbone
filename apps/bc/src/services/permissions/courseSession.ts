import { getAccountById } from '@/db/account'
import { getCourseSessionForProfessor } from '@/db/courseSession'
import { getDeactivableFeatureRestrictions } from '@/services/serverFunctions/deactivableFeatures'
import { DeactivatableFeature, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
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

export const canAddCourseSessionTrainee = async (user: UserSession, courseSessionId: string) => {
  if (!user.organizationVersionId || !(await canManageCourseSession(user, courseSessionId))) {
    return false
  }

  const restrictions = await getDeactivableFeatureRestrictions(DeactivatableFeature.Creation)
  return !restrictions?.active || !restrictions.deactivatedEnvironments.includes(user.environment)
}
