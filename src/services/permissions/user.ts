import { canEditMemberRole, isUntrainedRole } from '@/utils/organization'
import { User as DbUser, Prisma, Role, UserStatus } from '@prisma/client'
import { User } from 'next-auth'

export const canEditSelfRole = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.GESTIONNAIRE

export const canAddMember = (
  user: User,
  member: Pick<Prisma.UserCreateInput, 'role'>,
  organizationId: string | null,
) => {
  if (!organizationId) {
    return false
  }

  if (user.role === Role.COLLABORATOR) {
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

export const canDeleteMember = (user: User, member: DbUser | null) => {
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

export const canChangeRole = (user: User, member: DbUser | null, newRole: Role) => {
  if (!member) {
    return false
  }

  if (user.id === member.id && !canEditSelfRole(user.role)) {
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

  if (!member.level && !isUntrainedRole(newRole)) {
    return false
  }

  return true
}
