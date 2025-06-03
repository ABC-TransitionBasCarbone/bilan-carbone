'use client'

import { TeamMember } from '@/db/account'
import { UserStatus } from '@prisma/client'
import { UserSession } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
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
  const t = useTranslations('team')
  console.log(team)

  return (
    <SessionProvider>
      <Breadcrumbs current={tNav('team')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block title={t('title')} as="h1" />
      <InvitationsToValidate
        usersToValidate={team.filter((member) => member.user.status === UserStatus.PENDING_REQUEST)}
        user={user}
      />
      <PendingInvitations team={team.filter((member) => member.user.status === UserStatus.VALIDATED)} user={user} />
      <Team team={team.filter((member) => member.user.status === UserStatus.ACTIVE)} user={user} crOrga={crOrga} />
    </SessionProvider>
  )
}

export default TeamPage
