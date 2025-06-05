import { CutRoles } from '@/services/roles'
import { Environment, Prisma, Role, UserStatus } from '@prisma/client'
import { UserSession } from 'next-auth'
import { canEditMemberRole } from './organization'

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
    where: canEditMemberRole(user)
      ? { organizationVersionId: user.organizationVersionId }
      : { user: { status: UserStatus.ACTIVE }, organizationVersionId: user.organizationVersionId },
  }) satisfies Prisma.AccountFindManyArgs

export const getEnvironmentRoles = (environment: Environment) => {
  if (environment === Environment.CUT) {
    return CutRoles
  }
  return Role
}

export const getRoleToSetForUntrained = (role: Exclude<Role, 'SUPER_ADMIN'>, environment: Environment) => {
  if (environment === Environment.CUT) {
    return role
  }

  return role === Role.ADMIN || role === Role.GESTIONNAIRE ? Role.GESTIONNAIRE : Role.DEFAULT
}

const getUntrainedRoles = (environment: Environment) => {
  if (environment === Environment.CUT) {
    return Object.keys(CutRoles)
  }

  return [Role.GESTIONNAIRE, Role.DEFAULT]
}

export const canBeUntrainedRole = (role: Role, environment: Environment) =>
  getUntrainedRoles(environment).includes(role)
