import { getAccountById } from '@/db/account'
import { getOrganizationVersionById, OrganizationVersionWithOrganization } from '@/db/organization'
import { canEditOrganizationVersion, hasEditionRole, isInOrgaOrParent } from '@/utils/organization'
import { UserSession } from 'next-auth'
import { auth } from '../auth'
import { getOrganizationStudiesFromOtherUsers } from '../serverFunctions/study'

export const isInOrgaOrParentFromId = async (
  userOrganizationVersionId: string | null,
  organizationVersionId: string,
) => {
  if (userOrganizationVersionId === organizationVersionId) {
    return true
  }

  const organizationVersion = await getOrganizationVersionById(organizationVersionId)
  return (
    organizationVersion &&
    userOrganizationVersionId &&
    isInOrgaOrParent(userOrganizationVersionId, organizationVersion as OrganizationVersionWithOrganization)
  )
}

export const canCreateOrganization = async (account: UserSession) => {
  const dbAccount = await getAccountById(account.accountId)

  if (!dbAccount) {
    return false
  }

  const organization = await getOrganizationVersionById(dbAccount.organizationVersionId)
  if (!organization || !organization.isCR) {
    return false
  }

  return true
}

export const canUpdateOrganizationVersion = async (account: UserSession, organizationVersionId: string) => {
  const dbAccount = await getAccountById(account.accountId)

  if (!dbAccount) {
    return false
  }

  if (!isInOrgaOrParentFromId(account.organizationVersionId, organizationVersionId)) {
    return false
  }

  const organizationVersion = (await getOrganizationVersionById(
    account.organizationVersionId,
  )) as OrganizationVersionWithOrganization
  if (!organizationVersion || !canEditOrganizationVersion(account, organizationVersion)) {
    return false
  }

  return true
}

export const canDeleteOrganizationVersion = async (organizationVersionId: string) => {
  const [session, targetOrganizationVersion] = await Promise.all([
    auth(),
    getOrganizationVersionById(organizationVersionId),
  ])
  if (!session || !session.user || !targetOrganizationVersion) {
    return false
  }

  if (
    !hasEditionRole(false, session.user.role) &&
    (await getOrganizationStudiesFromOtherUsers(organizationVersionId, session.user.userId))
  ) {
    return false
  }

  return targetOrganizationVersion.parentId === session.user.organizationVersionId
}
