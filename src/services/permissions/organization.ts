import { getAccountById } from '@/db/account'
import { getOrganizationVersionById, OrganizationVersionWithOrganization } from '@/db/organization'
import { getUserByEmail } from '@/db/user'
import { canEditOrganizationVersion, hasEditionRole, isInOrgaOrParent } from '@/utils/organization'
import { canEditMemberRole } from '@/utils/user'
import { UserSession } from 'next-auth'
import { dbActualizedAuth } from '../auth'
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

export const isVersionInOrgaOrParent = async (
  organizationId: string,
  organizationVersionId: { parentId: string | null; organization: { id: string } },
) => {
  if (organizationId === organizationVersionId.organization.id) {
    return true
  }

  const organizationVersion = await getOrganizationVersionById(organizationVersionId.parentId)
  return organizationId === organizationVersion?.organizationId
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

  if (!(await isInOrgaOrParentFromId(account.organizationVersionId, organizationVersionId))) {
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
    dbActualizedAuth(),
    getOrganizationVersionById(organizationVersionId),
  ])
  if (!session || !session.user || !targetOrganizationVersion) {
    return false
  }

  const organizationStudiesFromOtherUsers = await getOrganizationStudiesFromOtherUsers(
    organizationVersionId,
    session.user.accountId,
  )

  if (
    !hasEditionRole(true, session.user.role) ||
    (organizationStudiesFromOtherUsers.success && !!organizationStudiesFromOtherUsers.data)
  ) {
    return false
  }

  return targetOrganizationVersion.parentId === session.user.organizationVersionId
}

/**
 * This function does not take into account the fact that you cannot delete a member if it is the only validator on some studies
 * If you want to add the check, you need to call the getStudiesWithOnlyValidator function (return the list of studies where the user is the only validator)
 */
export const canDeleteMember = async (email: string) => {
  const session = await dbActualizedAuth()
  if (!session || !session.user) {
    return false
  }

  if (!canEditMemberRole(session.user)) {
    return false
  }

  const targetMember = await getUserByEmail(email)
  // Ici c'est normal de récupérer le premier account, on a juste besoin du userId
  if (!targetMember || targetMember.accounts[0].userId === session.user.id) {
    return false
  }

  const targetMemberAccount = targetMember.accounts.find(
    (account) => account.organizationVersionId === session.user.organizationVersionId,
  )
  if (!targetMemberAccount) {
    return false
  }
  return true
}
