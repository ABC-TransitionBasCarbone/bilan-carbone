import { AccountMipWithUser } from '@/types/accountMip.types'
import { canEditMemberRole } from '@/utils/user'
import { RoleMip, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'
import type { Prisma } from '@abc-transitionbascarbone/db-common'

export const canEditSelfRole = (userRole: RoleMip) => userRole === RoleMip.ADMIN

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

  if (member.role === RoleMip.SUPER_ADMIN) {
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

export const canChangeRole = (user: UserSession, member: AccountMipWithUser | null, newRole: RoleMip) => {
  if (!member) {
    return false
  }

  if (user.accountMipId === member.id) {
    return false
  }

  if (!canEditMemberRole(user)) {
    return false
  }

  if (user.organizationVersionMipId !== member.organizationVersionMipId) {
    return false
  }

  if (newRole === RoleMip.SUPER_ADMIN) {
    return false
  }

  return true
}
