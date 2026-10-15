import { getAccountsForTeam, TeamMember } from '@/db/account'
import { canEditMemberRole } from '@/utils/user'
import { UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { UserSession } from 'next-auth'

export const getAccountFromUserOrganization = async (
  user: Pick<UserSession, 'role' | 'organizationVersionId'>,
): Promise<TeamMember[]> => {
  return getAccountsForTeam({
    organizationVersionId: user.organizationVersionId,
    ...(!canEditMemberRole(user) && { status: UserStatus.ACTIVE }),
  })
}
