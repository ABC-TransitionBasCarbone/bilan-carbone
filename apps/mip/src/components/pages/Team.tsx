'use client'

import { TeamMember } from '@/db/accountMip'
import { UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import PendingInvitations from '../team/PendingInvitations'
import Team from '../team/TeamTable'

interface Props {
  user: UserSession
  team: TeamMember[]
}

const TeamPage = ({ user, team }: Props) => {
  const tNav = useTranslations('nav')

  return (
    <SessionProvider>
      {/* <Breadcrumbs current={tNav('team')} links={[{ label: tNav('home'), link: '/' }]} />

      <InvitationsToValidate
        usersToValidate={team.filter((member) => member.status === UserStatus.PENDING_REQUEST)}
        user={user}
      /> */}
      <PendingInvitations team={team.filter((member) => member.status === UserStatus.VALIDATED)} user={user} />
      <Team team={team.filter((member) => member.status === UserStatus.ACTIVE)} user={user} />
    </SessionProvider>
  )
}

export default TeamPage
