import { AccountWithUser } from '@/db/account'
import { canEditMemberRole, isUntrainedRole } from '@/utils/organization'
import { User as DbUser, Prisma, Role, UserStatus } from '@prisma/client'
import { UserSession } from 'next-auth'

export const isAdmin = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN

export const canEditSelfRole = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.GESTIONNAIRE

export const findUserInfo = (user: UserSession) =>
  ({
    select: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          level: true,
          status: true,
          updatedAt: true,
        },
      },
      role: true,
      updatedAt: true,
    },
    where:
      user.role === Role.COLLABORATOR
        ? { user: { status: UserStatus.ACTIVE }, organizationVersionId: user.organizationVersionId }
        : { organizationVersionId: user.organizationVersionId },
  }) satisfies Prisma.AccountFindManyArgs

export const canAddMember = (
  user: UserSession,
  member: Pick<Prisma.AccountCreateInput, 'role'>,
  organizationVersionId: string | null,
) => {
  if (!organizationVersionId) {
    return false
  }

  if (user.role === Role.COLLABORATOR) {
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

export const canDeleteMember = (user: UserSession, member: DbUser | null) => {
  if (!member) {
    return false
  }

  if (user.role === Role.COLLABORATOR) {
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

  if (!member.user.level && !isUntrainedRole(newRole)) {
    return false
  }

  return true
}
