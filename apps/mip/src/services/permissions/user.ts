import { AccountMipWithUser } from '@/types/accountMip.types'
import { canEditMemberRole } from '@/utils/user'
import { Role } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'

export const canChangeRole = (user: UserSession, member: AccountMipWithUser | null, newRole: Role) => {
  if (!member) {
    return false
  }

  if (!canEditMemberRole(user)) {
    return false
  }

  if (user.organizationVersionMipId !== member.organizationVersionMipId) {
    return false
  }

  if (newRole === Role.SUPER_ADMIN) {
    return false
  }

  return true
}
