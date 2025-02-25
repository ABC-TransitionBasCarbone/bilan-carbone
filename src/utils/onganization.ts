import { isAdmin } from '@/services/permissions/user'
import { Organization } from '@prisma/client'
import { User } from 'next-auth'

export const isAdminOnOrga = (user: User, organization: Pick<Organization, 'id' | 'parentId'>) =>
  isAdmin(user.role) && isInOrgaOrParent(user.organizationId, organization)

export const isInOrgaOrParent = (
  userOrganizationId: string | null,
  organization: Pick<Organization, 'id' | 'parentId'>,
) => userOrganizationId === organization.id || userOrganizationId === organization.parentId
