// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { isAdmin } from '@/utils/user'
import { Organization, Role } from '@prisma/client'
import { UserSession } from 'next-auth'

export const isAdminOnOrga = (account: UserSession, organization: Pick<Organization, 'id' | 'parentId'>) =>
  isAdmin(account.role) && isInOrgaOrParent(account.organizationId, organization)

export const isInOrgaOrParent = (
  userOrganizationId: string | null,
  organization: Pick<Organization, 'id' | 'parentId'>,
) => userOrganizationId === organization.id || userOrganizationId === organization.parentId

export const hasEditionRole = (isCR: boolean, userRole: Role) =>
  isCR ? userRole !== Role.DEFAULT : isAdmin(userRole) || userRole === Role.GESTIONNAIRE

export const canEditOrganization = (
  account: UserSession,
  organization?: Pick<Organization, 'id' | 'parentId' | 'isCR'>,
) => {
  if (organization && !isInOrgaOrParent(account.organizationId, organization)) {
    return false
  }
  const isCR = !!organization?.isCR || organization?.parentId === account.organizationId
  return hasEditionRole(isCR, account.role)
}

export const canEditMemberRole = (account: UserSession) => isAdmin(account.role) || account.role === Role.GESTIONNAIRE

export const isUntrainedRole = (role: Role) => role === Role.GESTIONNAIRE || role === Role.DEFAULT
