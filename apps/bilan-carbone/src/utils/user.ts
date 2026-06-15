import { isSimplified } from '@/services/permissions/environment'
import { ClicksonRoles, CutRoles } from '@/services/roles'
import type { Prisma } from '@abc-transitionbascarbone/db-common'
import { findUserInfoSelect } from '@abc-transitionbascarbone/db-common/db'
import { Environment, Role, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'

export const isAdmin = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN

export const findUserInfo = (user: UserSession) =>
  ({
    ...findUserInfoSelect({ formationName: true }),
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
  if (isSimplified(environment)) {
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
