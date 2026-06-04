import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import TeamPage from '@/components/pages/Team'
import { getAccountMipFromUserOrganization } from '@/db/accountMip'
// import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

export const revalidate = 0

const Team = async ({ user }: UserSessionProps) => {
  console.log('sesssion, ', user)
  // if (!user.organizationVersionId) {
  //   return <NotFound />
  // }
  const team = await getAccountMipFromUserOrganization(user)

  return <TeamPage user={user} team={team} />
}

export default withAuth(Team)
