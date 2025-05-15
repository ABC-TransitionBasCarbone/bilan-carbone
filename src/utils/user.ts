import { Prisma, Role, UserStatus } from '@prisma/client'
import { User } from 'next-auth'

export const isAdmin = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN

export const findUserInfo = (user: User) =>
  ({
    select: {
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      level: true,
      status: true,
      updatedAt: true,
    },
    where:
      user.role === Role.COLLABORATOR
        ? { status: UserStatus.ACTIVE, organizationId: user.organizationId }
        : { organizationId: user.organizationId },
  }) satisfies Prisma.UserFindManyArgs
