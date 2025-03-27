import { AccountWithUser } from '@/db/account'
import { canEditMemberRole, isUntrainedRole } from '@/utils/organization'
import { User as DbUser, Prisma, Role, UserStatus } from '@prisma/client'
import { UserSession } from 'next-auth'

export const canEditSelfRole = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.GESTIONNAIRE

export const canAddMember = (
  user: UserSession,
  member: Pick<Prisma.AccountCreateInput, 'role'>,
  organizationId: string | null,
) => {
  if (!organizationId) {
    return false
  }

  if (!canEditMemberRole(user)) {
    return false
  }

  if (member.role === Role.SUPER_ADMIN) {
    return false
  }

  if (organizationId !== user.organizationId) {
    return false
  }
  return true
}

export const canDeleteMember = (user: UserSession, member: DbUser | null) => {
  if (!member) {
    return false
  }

  if (user.organizationId !== member.organizationId) {
    return false
  }

  if (!canEditMemberRole(user)) {
    return false
  }

  if (member.status === UserStatus.ACTIVE) {
    return false
  }

  return true
}

export const canChangeRole = (user: UserSession, member: AccountWithUser | null, newRole: Role) => {
  if (!member) {
    return false
  }

  if (user.accountId === member.id && !canEditSelfRole(user.role)) {
    return false
  }

  if (!canEditMemberRole(user)) {
    return false
  }

  if (user.organizationId !== member.organizationId) {
    return false
  }

  if (newRole === Role.SUPER_ADMIN) {
    return false
  }

  if (!member.user.level && !isUntrainedRole(newRole)) {
    return false
  }

  return true
}
