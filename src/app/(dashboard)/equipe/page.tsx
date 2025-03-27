import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import TeamPage from '@/components/pages/Team'
import { getAccountFromUserOrganization } from '@/db/account'
import { getOrganizationById } from '@/db/organization'

export const revalidate = 0

const Team = async ({ user }: UserSessionProps) => {
  if (!user.organizationId) {
    return <NotFound />
  }
  const [team, organization] = await Promise.all([
    getAccountFromUserOrganization(user),
    getOrganizationById(user.organizationId),
  ])

  return <TeamPage user={user} team={team} crOrga={organization?.isCR} />
}

export default withAuth(Team)
