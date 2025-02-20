import { User as DbUser, Prisma, Role, UserStatus } from '@prisma/client'
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
      status: true,
      updatedAt: true,
    },
    where:
      user.role === Role.DEFAULT
        ? { status: UserStatus.ACTIVE, organizationId: user.organizationId }
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

  if (member.status === UserStatus.ACTIVE) {
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

  if (user.role === Role.DEFAULT) {
    return false
  }

  if (isAdmin(user.role) && user.organizationId !== member.organizationId) {
    return false
  }

  if (newRole === Role.SUPER_ADMIN) {
    return false
  }

  if (!user.level && newRole !== Role.GESTIONNAIRE) {
    return false
  }

  return true
}
