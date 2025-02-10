import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import TeamPage from '@/components/pages/Team'
import { getUserFromUserOrganization } from '@/db/user'

export const revalidate = 0

const Team = async ({ user }: UserProps) => {
  if (!user.organizationId) {
    return <NotFound />
  }
  const team = await getUserFromUserOrganization(user)
  return <TeamPage user={user} team={team} />
}

export default withAuth(Team)
