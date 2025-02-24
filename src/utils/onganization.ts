import { isAdmin } from '@/services/permissions/user'
import { Organization } from '@prisma/client'
import { User } from 'next-auth'

export const isAdminOnOrga = (user: User, organization: Pick<Organization, 'id' | 'parentId'>) =>
  isAdmin(user.role) && (user.organizationId === organization.id || user.organizationId === organization.parentId)
