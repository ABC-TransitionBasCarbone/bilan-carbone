import { isAdmin } from '@/services/permissions/user'
import { Organization, Role } from '@prisma/client'
import { User } from 'next-auth'

export const isAdminOnOrga = (user: User, organization: Pick<Organization, 'id' | 'parentId'>) =>
  isAdmin(user.role) && isInOrgaOrParent(user.organizationId, organization)

export const isInOrgaOrParent = (
  userOrganizationId: string | null,
  organization: Pick<Organization, 'id' | 'parentId'>,
) => userOrganizationId === organization.id || userOrganizationId === organization.parentId

export const hasEditionRole = (isCR: boolean, userRole: Role) =>
  isCR ? userRole !== Role.DEFAULT : isAdmin(userRole) || userRole === Role.GESTIONNAIRE

export const canEditOrganization = (user: User, organization?: Pick<Organization, 'id' | 'parentId' | 'isCR'>) => {
  if (organization && !isInOrgaOrParent(user.organizationId, organization)) {
    return false
  }
  const isCR = !!organization?.isCR || organization?.parentId === user.organizationId
  return hasEditionRole(isCR, user.role)
}

export const canEditMemberRole = (user: User) => isAdmin(user.role) || user.role === Role.GESTIONNAIRE

export const isUntrainedRole = (role: Role) => role === Role.GESTIONNAIRE || role === Role.DEFAULT
