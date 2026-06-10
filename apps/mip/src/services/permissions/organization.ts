import { getUserByEmail } from '@/db/user'
import { canEditMemberRole } from '@/utils/user'
import { dbActualizedAuth } from '../auth'

export const canDeleteMember = async (email: string) => {
  const session = await dbActualizedAuth()
  if (!session || !session.user) {
    return false
  }

  if (!canEditMemberRole(session.user)) {
    return false
  }

  const targetMember = await getUserByEmail(email)
  if (!targetMember || targetMember.accountsMip[0].userId === session.user.id) {
    return false
  }

  const targetMemberAccountMip = targetMember.accountsMip.find(
    (accountMip) => accountMip.organizationVersionMipId === session.user.organizationVersionMipId,
  )
  if (!targetMemberAccountMip) {
    return false
  }
  return true
}
