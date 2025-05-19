import { Prisma, Role, UserStatus } from '@prisma/client'
import { UserSession } from 'next-auth'

export const isAdmin = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN

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
