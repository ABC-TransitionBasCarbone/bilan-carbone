import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import TeamPage from '@/components/pages/Team'
import { getAccountFromUserOrganization } from '@/db/account'
import { getOrganizationVersionIsCR } from '@/db/organization'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

export const revalidate = 0

const Team = async ({ user }: UserSessionProps) => {
  if (!user.organizationVersionId) {
    return <NotFound />
  }
  const [team, isCR] = await Promise.all([
    getAccountFromUserOrganization(user),
    getOrganizationVersionIsCR(user.organizationVersionId),
  ])

  return <TeamPage user={user} team={team} crOrga={isCR} />
}

export default withAuth(Team)
