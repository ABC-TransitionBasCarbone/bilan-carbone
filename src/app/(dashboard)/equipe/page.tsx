// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import TeamPage from '@/components/pages/Team'
import { getOrganizationById } from '@/db/organization'
import { getUserFromUserOrganization } from '@/db/user'

export const revalidate = 0

const Team = async ({ user }: UserProps) => {
  if (!user.organizationId) {
    return <NotFound />
  }
  const [team, organization] = await Promise.all([
    getUserFromUserOrganization(user),
    getOrganizationById(user.organizationId),
  ])

  return <TeamPage user={user} team={team} crOrga={organization?.isCR} />
}

export default withAuth(Team)
