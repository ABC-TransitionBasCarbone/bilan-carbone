import { ClicksonRoles, CourseRoles, CutRoles } from '@/services/roles'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import { findAccountSelect } from '@abc-transitionbascarbone/common/db/db/common.select'
import { Environment, Role, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { isSimplified } from '@abc-transitionbascarbone/common/utils/environments'
import { UserSession } from 'next-auth'

export const isAdmin = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN

export const findUserInfo = (user: Pick<UserSession, 'role' | 'organizationVersionId'>) =>
  ({
    select: findAccountSelect({ formationName: true }),
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
    case Environment.COURSE_BC:
    case Environment.COURSE_TILT:
      return CourseRoles
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

export const canEditMemberRole = (account: Pick<UserSession, 'role'>) =>
  isAdmin(account.role) || account.role === Role.GESTIONNAIRE
