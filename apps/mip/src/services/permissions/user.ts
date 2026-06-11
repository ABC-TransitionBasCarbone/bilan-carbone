import { AccountMipWithUser } from '@/types/accountMip.types'
import { canEditMemberRole } from '@/utils/user'
import type { Prisma } from '@abc-transitionbascarbone/db-common'
import { Role, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'

export const canEditSelfRole = (userRole: Role) => userRole === Role.ADMIN || userRole === Role.GESTIONNAIRE

export const canAddMember = (
  user: UserSession,
  member: Pick<Prisma.AccountMipCreateInput, 'role'>,
  organizationVersionMipId: string | null,
) => {
  if (!organizationVersionMipId) {
    return false
  }

  if (!canEditMemberRole(user)) {
    return false
  }

  if (member.role === Role.SUPER_ADMIN) {
    return false
  }

  if (organizationVersionMipId !== user.organizationVersionMipId) {
    return false
  }
  return true
}

export const canDeleteMember = (user: UserSession, member: AccountMipWithUser | null) => {
  if (!member) {
    return false
  }

  if (user.organizationVersionMipId !== member.organizationVersionMipId) {
    return false
  }

  if (!canEditMemberRole(user)) {
    return false
  }

  if (member.status === UserStatus.ACTIVE) {
    return false
  }

  return true
}
