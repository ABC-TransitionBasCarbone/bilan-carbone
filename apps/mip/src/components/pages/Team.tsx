'use client'

import type { TeamMember } from '@/db/accountMip'
import { UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import type { UserSession } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import PendingInvitations from '../team/PendingInvitations'
import Team from '../team/TeamTable'

interface Props {
  user: UserSession
  team: TeamMember[]
}

const TeamPage = ({ user, team }: Props) => {
  return (
    <SessionProvider>
      <PendingInvitations team={team.filter((member) => member.status === UserStatus.VALIDATED)} user={user} />
      <Team team={team.filter((member) => member.status === UserStatus.ACTIVE)} user={user} />
    </SessionProvider>
  )
}

export default TeamPage
