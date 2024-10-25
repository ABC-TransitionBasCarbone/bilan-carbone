import { useTranslations } from 'next-intl'
import React from 'react'
import Team from '../team/TeamTable'
import { TeamMember } from '@/db/user'
import { User } from 'next-auth'
import { Role } from '@prisma/client'
import LinkButton from '../base/LinkButton'
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
      <Block>
        <div className="align-center justify-between">
          <h1>{t('title')}</h1>
          {user.role !== Role.DEFAULT && (
            <LinkButton href="equipe/ajouter" data-testid="add-member-link">
              {t('new-user')}
            </LinkButton>
          )}
        </div>
      </Block>
      <PendingInvitations team={team.filter((member) => !member.isActive)} user={user} />
      <Team team={team.filter((member) => member.isActive)} user={user} />
    </>
  )
}

export default TeamPage
