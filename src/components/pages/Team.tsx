import { TeamMember } from '@/db/user'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import PendingInvitations from '../team/PendingInvitations'
import Team from '../team/TeamTable'

interface Props {
  user: User
  team: TeamMember[]
}

const TeamPage = ({ user, team }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('team')
  return (
    <>
      <Breadcrumbs current={tNav('team')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block title={t('title')} as="h1" />
      <PendingInvitations team={team.filter((member) => !member.isActive)} user={user} />
      <Team team={team.filter((member) => member.isActive)} user={user} />
    </>
  )
}

export default TeamPage
