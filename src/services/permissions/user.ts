import { Prisma, Role, User as DbUser } from '@prisma/client'
import { User } from 'next-auth'

export const findUserInfo = (user: User) =>
  ({
    select: {
      email: true,
      firstName: true,
      lastName: true,
      role: user.role !== Role.DEFAULT,
      level: true,
      isActive: true,
      updatedAt: true,
    },
    where:
      user.role === Role.DEFAULT
        ? { isActive: true, organizationId: user.organizationId }
        : { organizationId: user.organizationId },
  }) satisfies Prisma.UserFindManyArgs

export const canAddMember = (user: User, member: Pick<Prisma.UserCreateInput, 'role'>, organizationId: string) => {
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

  if (member.isActive || member.password) {
    return false
  }
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

  if (user.role === Role.ADMIN && user.organizationId !== member.organizationId) {
    return false
  }

  if (newRole === Role.SUPER_ADMIN) {
    return false
  }

  return true
}
