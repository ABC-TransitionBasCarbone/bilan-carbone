import { useTranslations } from 'next-intl'
import React from 'react'
import Team from '../team/TeamTable'
import { TeamMember } from '@/db/user'
import { User } from 'next-auth'
import PendingInvitations from '../team/PendingInvitations'
import Block from '../base/Block'

interface Props {
  user: User
  team: TeamMember[]
}

const TeamPage = ({ user, team }: Props) => {
  const t = useTranslations('team')
  return (
    <>
      <Block title={t('title')} as="h1" />
      <PendingInvitations team={team.filter((member) => !member.isActive)} user={user} />
      <Team team={team.filter((member) => member.isActive)} user={user} />
    </>
  )
}

export default TeamPage
