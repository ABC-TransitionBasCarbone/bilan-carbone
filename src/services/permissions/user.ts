import { AccountWithUser } from '@/db/account'
import { canEditMemberRole } from '@/utils/user'
import { canBeUntrainedRole } from '@/utils/user'
import { Prisma, Role, UserStatus } from '@prisma/client'
import { UserSession } from 'next-auth'

export const canEditSelfRole = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.GESTIONNAIRE

export const canAddMember = (
  user: UserSession,
  member: Pick<Prisma.AccountCreateInput, 'role'>,
  organizationVersionId: string | null,
) => {
  if (!organizationVersionId) {
    return false
  }

  if (!canEditMemberRole(user)) {
    return false
  }

  if (member.role === Role.SUPER_ADMIN) {
    return false
  }

  if (organizationVersionId !== user.organizationVersionId) {
    return false
  }
  return true
}

export const canDeleteMember = (user: UserSession, member: AccountWithUser | null) => {
  if (!member) {
    return false
  }

  if (user.organizationVersionId !== member.organizationVersionId) {
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

  if (user.organizationVersionId !== member.organizationVersionId) {
    return false
  }

  if (newRole === Role.SUPER_ADMIN) {
    return false
  }

  if (!member.user.level && !canBeUntrainedRole(newRole, user.environment)) {
    return false
  }

  return true
}
