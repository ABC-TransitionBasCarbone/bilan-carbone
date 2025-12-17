'use client'

import { TeamMember } from '@/db/account'
import { UserStatus } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import InvitationsToValidate from '../team/InvitationsToValidate'
import PendingInvitations from '../team/PendingInvitations'
import Team from '../team/TeamTable'

interface Props {
  user: UserSession
  team: TeamMember[]
  crOrga?: boolean
}

const TeamPage = ({ user, team, crOrga = false }: Props) => {
  const tNav = useTranslations('nav')

  return (
    <>
      <Breadcrumbs current={tNav('team')} links={[{ label: tNav('home'), link: '/' }]} />
      <InvitationsToValidate
        usersToValidate={team.filter((member) => member.status === UserStatus.PENDING_REQUEST)}
        user={user}
      />
      <PendingInvitations team={team.filter((member) => member.status === UserStatus.VALIDATED)} user={user} />
      <Team team={team.filter((member) => member.status === UserStatus.ACTIVE)} user={user} crOrga={crOrga} />
    </>
  )
}

export default TeamPage
