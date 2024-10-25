import TeamPage from '@/components/pages/Team'
import { getUserFromUserOrganization } from '@/db/user'
import { auth } from '@/services/auth'

export const revalidate = 0

const Team = async () => {
  const session = await auth()
  if (!session) {
    return null
  }
  const team = await getUserFromUserOrganization(session.user)
  return <TeamPage user={session.user} team={team} />
}

export default Team
