import { isSimplifiedEnvironment } from '@/services/publicodes/simplifiedPublicodesConfig'
import { ClicksonRoles, CutRoles } from '@/services/roles'
import { Environment, Role, UserStatus } from '@repo/db-common/enums'
import type { Prisma } from '@repo/db-common'
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
          updatedAt: true,
        },
      },
      status: true,
      role: true,
      formationName: true,
      updatedAt: true,
    },
    where: canEditMemberRole(user)
      ? { organizationVersionId: user.organizationVersionId }
      : { status: UserStatus.ACTIVE, organizationVersionId: user.organizationVersionId },
  }) satisfies Prisma.AccountFindManyArgs

export const getEnvironmentRoles = (environment: Environment) => {
  switch (environment) {
    case Environment.CUT:
      return CutRoles
    case Environment.CLICKSON:
      return ClicksonRoles
    default:
      return Role
  }
}

export const getRoleToSetForUntrained = (role: Exclude<Role, 'SUPER_ADMIN'>, environment: Environment) => {
  if (isSimplifiedEnvironment(environment)) {
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

export const canEditMemberRole = (account: UserSession) => isAdmin(account.role) || account.role === Role.GESTIONNAIRE
