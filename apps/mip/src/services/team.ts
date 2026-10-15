import { getAccountsMipForTeam, TeamMember } from '@/db/accountMip'
import { canEditMemberRole } from '@/utils/user'
import { UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { UserSession } from 'next-auth'

export const getAccountMipFromUserOrganization = async (user: UserSession): Promise<TeamMember[]> => {
  return getAccountsMipForTeam({
    organizationVersionMipId: user.organizationVersionMipId,
    ...(!canEditMemberRole(user) && { status: UserStatus.ACTIVE }),
  })
}
