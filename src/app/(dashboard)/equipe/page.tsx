import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import TeamPage from '@/components/pages/Team'
import { getAccountFromUserOrganization } from '@/db/account'
import { getOrganizationVersionById } from '@/db/organization'

export const revalidate = 0

const Team = async ({ user }: UserSessionProps) => {
  if (!user.organizationVersionId) {
    return <NotFound />
  }
  const [team, organizationVersion] = await Promise.all([
    getAccountFromUserOrganization(user),
    getOrganizationVersionById(user.organizationVersionId),
  ])

  return <TeamPage user={user} team={team} crOrga={organizationVersion?.isCR} />
}

export default withAuth(Team)
