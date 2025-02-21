import { isAdmin } from '@/services/permissions/user'
import { User } from 'next-auth'

export const isAdminOnOrga = (user: User, organizationId: string) =>
  isAdmin(user.role) && user.organizationId === organizationId
