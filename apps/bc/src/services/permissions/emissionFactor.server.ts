import { getOrganizationVersionForRightsCheck } from '@/db/organization'
import { getUserById } from '@/db/user'
import { hasActiveLicence } from '@/utils/organization'
import { type Account } from '@abc-transitionbascarbone/common/db'
import { Role } from '@abc-transitionbascarbone/common/db/enums'

export const canCreateEmissionFactor = async (account: Pick<Account, 'role' | 'userId' | 'organizationVersionId'>) => {
  const hasRole = ([Role.ADMIN, Role.COLLABORATOR, Role.SUPER_ADMIN] as Role[]).includes(account.role)

  const user = await getUserById(account.userId)
  if (!user) {
    return false
  }

  const hasLevel = !!user.level
  const organizationVersion = await getOrganizationVersionForRightsCheck(account.organizationVersionId)

  return organizationVersion && hasActiveLicence(organizationVersion) && hasRole && hasLevel
}
