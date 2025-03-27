import { getAccountById } from '@/db/account'
import { getOrganizationById } from '@/db/organization'
import { canEditOrganization, hasEditionRole, isInOrgaOrParent } from '@/utils/organization'
import { UserSession } from 'next-auth'
import { auth } from '../auth'
import { getOrganizationStudiesFromOtherUsers } from '../serverFunctions/study'

export const isInOrgaOrParentFromId = async (userOrganizationId: string | null, organizationId: string) => {
  if (userOrganizationId === organizationId) {
    return true
  }

  const organization = await getOrganizationById(organizationId)
  return organization && isInOrgaOrParent(userOrganizationId, organization)
}

export const canCreateOrganization = async (account: UserSession) => {
  const dbAccount = await getAccountById(account.accountId)

  if (!dbAccount) {
    return false
  }

  const organization = await getOrganizationById(dbAccount.organizationId)
  if (!organization || !organization.isCR) {
    return false
  }

  return true
}

export const canUpdateOrganization = async (account: UserSession, organizationId: string) => {
  const dbAccount = await getAccountById(account.accountId)

  if (!dbAccount) {
    return false
  }

  if (!(await isInOrgaOrParentFromId(account.organizationId, organizationId))) {
    return false
  }

  const organization = await getOrganizationById(account.organizationId)
  if (!organization || !canEditOrganization(account, organization)) {
    return false
  }

  return true
}

export const canDeleteOrganization = async (organizationId: string) => {
  const [session, targetOrganization] = await Promise.all([auth(), getOrganizationById(organizationId)])
  if (!session || !session.user || !targetOrganization) {
    return false
  }

  if (
    !hasEditionRole(true, session.user.role) ||
    (await getOrganizationStudiesFromOtherUsers(organizationId, session.user.id))
  ) {
    return false
  }
  return targetOrganization.parentId === session.user.organizationId
}
