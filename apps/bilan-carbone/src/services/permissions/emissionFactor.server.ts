import { getOrganizationVersionForRightsCheck } from '@/db/organization'
import { getUserById } from '@/db/user'
import { hasActiveLicence } from '@/utils/organization'
import { type Account } from '@abc-transitionbascarbone/db-common'
import { Role } from '@abc-transitionbascarbone/db-common/enums'

export const canCreateEmissionFactor = async (account: Account) => {
  const hasRole = ([Role.ADMIN, Role.COLLABORATOR, Role.SUPER_ADMIN] as Role[]).includes(account.role)

  const user = await getUserById(account.userId)
  if (!user) {
    return false
  }

  const hasLevel = !!user.level
  const organizationVersion = await getOrganizationVersionForRightsCheck(account.organizationVersionId)

  return organizationVersion && hasActiveLicence(organizationVersion) && hasRole && hasLevel
}
