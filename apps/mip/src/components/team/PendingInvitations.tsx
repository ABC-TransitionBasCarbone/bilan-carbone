import { TeamMember } from '@/db/accountMip'
import { deleteMember, resendInvitation } from '@/services/serverFunctions/user'
import { canEditMemberRole } from '@/utils/user'
import PendingInvitationsCommon from '@abc-transitionbascarbone/components/src/team/PendingInvitationsCommon'
import { UserSession } from 'next-auth'

interface Props {
  user: UserSession
  team: TeamMember[]
}

const PendingInvitations = ({ user, team }: Props) => {
  return !canEditMemberRole(user) || team.length === 0 ? null : (
    <PendingInvitationsCommon team={team} resendInvitation={resendInvitation} deleteMember={deleteMember} />
  )
}

export default PendingInvitations
