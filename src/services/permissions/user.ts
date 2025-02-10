import { User as DbUser, Prisma, Role } from '@prisma/client'
import { User } from 'next-auth'

export const isAdmin = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN

export const findUserInfo = (user: User) =>
  ({
    select: {
      email: true,
      firstName: true,
      lastName: true,
      role: user.role !== Role.DEFAULT,
      level: true,
      isActive: true,
      isValidated: true,
      updatedAt: true,
    },
    where:
      user.role === Role.DEFAULT
        ? { isActive: true, isValidated: true, organizationId: user.organizationId }
        : { organizationId: user.organizationId },
  }) satisfies Prisma.UserFindManyArgs

export const canAddMember = (
  user: User,
  member: Pick<Prisma.UserCreateInput, 'role'>,
  organizationId: string | null,
) => {
  if (!organizationId) {
    return false
  }

  if (user.role === Role.DEFAULT) {
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

  if (user.role === Role.DEFAULT) {
    return false
  }

  if (member.isValidated && (member.isActive || member.password)) {
    return false
  }

  return true
}

export const canChangeRole = (user: User, member: DbUser | null, newRole: Role) => {
  if (!member) {
    return false
  }

  if (user.id === member.id) {
    return false
  }

  if (user.role === Role.DEFAULT || user.role === Role.GESTIONNAIRE) {
    return false
  }

  if (isAdmin(user.role) && user.organizationId !== member.organizationId) {
    return false
  }

  if (newRole === Role.SUPER_ADMIN) {
    return false
  }

  return true
}
