import { TeamMember } from '@/db/user'
import { UserStatus } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import InvitationsToValidate from '../team/InvitationsToValidate'
import PendingInvitations from '../team/PendingInvitations'
import Team from '../team/TeamTable'

interface Props {
  user: User
  team: TeamMember[]
  crOrga?: boolean
}

const TeamPage = ({ user, team, crOrga = false }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('team')

  return (
    <>
      <Breadcrumbs current={tNav('team')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block title={t('title')} as="h1" />
      <InvitationsToValidate team={team.filter((member) => member.status === UserStatus.PENDING_REQUEST)} user={user} />
      <PendingInvitations team={team.filter((member) => member.status === UserStatus.VALIDATED)} user={user} />
      <Team team={team.filter((member) => member.status === UserStatus.ACTIVE)} user={user} crOrga={crOrga} />
    </>
  )
}

export default TeamPage
