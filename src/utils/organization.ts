import { isAdmin } from '@/utils/user'
import { Role } from '@prisma/client'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import { UserSession } from 'next-auth'

export const isAdminOnOrga = (account: UserSession, organizationVersion: OrganizationVersionWithOrganization) =>
  isAdmin(account.role) && isInOrgaOrParent(account.organizationVersionId, organizationVersion)

export const isInOrgaOrParent = (
  userOrganizationId: string | null,
  organizationVersion: OrganizationVersionWithOrganization,
) => userOrganizationId === organizationVersion.id || userOrganizationId === organizationVersion.organization.parentId

export const hasEditionRole = (isCR: boolean, userRole: Role) =>
  isCR ? userRole !== Role.DEFAULT : isAdmin(userRole) || userRole === Role.GESTIONNAIRE

export const canEditOrganizationVersion = (
  account: UserSession,
  organizationVersion?: OrganizationVersionWithOrganization,
) => {
  if (organizationVersion && !isInOrgaOrParent(account.organizationVersionId, organizationVersion)) {
    return false
  }
  const isCR =
    !!organizationVersion?.isCR || organizationVersion?.organization?.parentId === account.organizationVersionId
  return hasEditionRole(isCR, account.role)
}

export const canEditMemberRole = (account: UserSession) => isAdmin(account.role) || account.role === Role.GESTIONNAIRE

export const isUntrainedRole = (role: Role) => role === Role.GESTIONNAIRE || role === Role.DEFAULT
