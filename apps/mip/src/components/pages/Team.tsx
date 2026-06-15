'use client'

import { TeamMember } from '@/db/accountMip'
import { UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import Team from '../team/TeamTable'

interface Props {
  user: UserSession
  team: TeamMember[]
}

const TeamPage = ({ user, team }: Props) => {
  return (
    <SessionProvider>
      <>test</>
      {/* 
      <InvitationsToValidate
        usersToValidate={team.filter((member) => member.status === UserStatus.PENDING_REQUEST)}
        user={user}
      /> */}
      {/* <PendingInvitations team={team.filter((member) => member.status === UserStatus.VALIDATED)} user={user} /> */}
      <Team team={team.filter((member) => member.status === UserStatus.ACTIVE)} user={user} />
    </SessionProvider>
  )
}

export default TeamPage
