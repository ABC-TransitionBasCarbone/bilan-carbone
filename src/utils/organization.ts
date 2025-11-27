import { OrganizationVersionWithOrganization, OrganizationVersionWithParentLicence } from '@/db/organization'
import { isAdmin } from '@/utils/user'
import { Role } from '@prisma/client'
import { UserSession } from 'next-auth'

export const isAdminOnOrga = (account: UserSession, organizationVersion: OrganizationVersionWithOrganization) =>
  isAdmin(account.role) && isInOrgaOrParent(account.organizationVersionId, organizationVersion)

export const isInOrgaOrParent = (
  userOrganizationVersionId: string | null,
  organizationVersion: {
    id: string
    parentId: string | null
  },
) =>
  userOrganizationVersionId &&
  (userOrganizationVersionId === organizationVersion.id || userOrganizationVersionId === organizationVersion.parentId)

export const hasEditionRole = (isCR: boolean, userRole: Role) =>
  isCR ? userRole !== Role.DEFAULT : isAdmin(userRole) || userRole === Role.GESTIONNAIRE

export const canEditOrganizationVersion = (
  account: UserSession,
  organizationVersion?: OrganizationVersionWithOrganization,
) => {
  if (organizationVersion && !isInOrgaOrParent(account.organizationVersionId, organizationVersion)) {
    return false
  }

  const isCR = !!organizationVersion?.parentId && organizationVersion.parentId === account.organizationVersionId
  return hasEditionRole(isCR, account.role)
}

export const hasActiveLicence = (
  organizationVersion: Pick<Exclude<OrganizationVersionWithParentLicence, null>, 'activatedLicence' | 'parent'>,
) => {
  const userOrgaVersion = organizationVersion.parent ? organizationVersion.parent : organizationVersion

  if (!userOrgaVersion) {
    return false
  }

  return userOrgaVersion.activatedLicence.includes(new Date().getFullYear())
}
