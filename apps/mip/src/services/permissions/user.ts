import { AccountMipWithUser } from '@/types/accountMip.types'
import { canEditMemberRole } from '@/utils/user'
import { RoleMip } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'

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
