import { getAccountById } from '@/db/account'
import { getOrganizationVersionForRightsCheck } from '@/db/organization'
import { getUserById } from '@/db/user'
import { hasActiveLicence } from '@/utils/organization'
import { getCourseAccess } from '@/utils/training'
import { type Account } from '@abc-transitionbascarbone/common/db'
import { Role } from '@abc-transitionbascarbone/common/db/enums'
import { isCourseEnvironment } from '@abc-transitionbascarbone/common/utils/environments'

export const canCreateEmissionFactor = async (
  account: Pick<Account, 'id' | 'role' | 'userId' | 'organizationVersionId'>,
) => {
  const hasRole = ([Role.ADMIN, Role.COLLABORATOR, Role.SUPER_ADMIN] as Role[]).includes(account.role)

  const user = await getUserById(account.userId)
  if (!user) {
    return false
  }

  const hasLevel = !!user.level
  const organizationVersion = await getOrganizationVersionForRightsCheck(account.organizationVersionId)

  let courseAccess
  if (organizationVersion && isCourseEnvironment(organizationVersion.environment)) {
    const dbAccount = await getAccountById(account.id)
    if (!dbAccount) {
      return false
    }
    courseAccess = { courseAccess: getCourseAccess(dbAccount) }
  }
  return organizationVersion && hasActiveLicence(organizationVersion, courseAccess) && hasRole && hasLevel
}
