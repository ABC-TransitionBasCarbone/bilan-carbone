import { AccountWithUser } from '@/types/account.types'
import { canEditMemberRole } from '@/utils/user'
import type { Account, CourseSession, Prisma } from '@abc-transitionbascarbone/common/db'
import { Role, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { isCourseEnvironment } from '@abc-transitionbascarbone/common/utils/environments'
import { canBeUntrainedRole } from '@abc-transitionbascarbone/common/utils/user'
import { UserSession } from 'next-auth'

export const canEditSelfRole = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.GESTIONNAIRE

export const canRegisterForCourseSession = (
  professor: Pick<UserSession, 'organizationVersionId' | 'environment'>,
  session: Pick<CourseSession, 'professorOrganizationVersionId' | 'environment'> | null,
  account: Pick<Account, 'status'> | null,
) =>
  !!professor.organizationVersionId &&
  isCourseEnvironment(professor.environment) &&
  session?.environment === professor.environment &&
  session.professorOrganizationVersionId === professor.organizationVersionId &&
  (!account || account.status !== UserStatus.SUSPENDED)

export const canAddMember = (
  user: UserSession,
  member: Pick<Prisma.AccountCreateInput, 'role'>,
  organizationVersionId: string | null,
) => {
  if (!organizationVersionId) {
    return false
  }

  if (!canEditMemberRole(user)) {
    return false
  }

  if (member.role === Role.SUPER_ADMIN) {
    return false
  }

  if (organizationVersionId !== user.organizationVersionId) {
    return false
  }
  return true
}

export const canDeleteMember = (user: UserSession, member: AccountWithUser | null) => {
  if (!member) {
    return false
  }

  if (user.organizationVersionId !== member.organizationVersionId) {
    return false
  }

  if (!canEditMemberRole(user)) {
    return false
  }

  if (member.status === UserStatus.ACTIVE || member.status === UserStatus.SUSPENDED) {
    return false
  }

  return true
}

export const canChangeRole = (user: UserSession, member: AccountWithUser | null, newRole: Role) => {
  if (!member) {
    return false
  }

  if (user.accountId === member.id && !canEditSelfRole(user.role)) {
    return false
  }

  if (!canEditMemberRole(user)) {
    return false
  }

  if (user.organizationVersionId !== member.organizationVersionId) {
    return false
  }

  if (newRole === Role.SUPER_ADMIN) {
    return false
  }

  if (!member.user.level && !canBeUntrainedRole(newRole, user.environment)) {
    return false
  }

  return true
}
