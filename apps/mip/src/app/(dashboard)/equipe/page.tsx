import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
// import NotFound from '@/components/pages/NotFound'

export const revalidate = 0

const Team = async ({ user }: UserSessionProps) => {
  // if (!user.organizationVersionId) {
  //   return <NotFound />
  // }
  // const [team, isCR] = await Promise.all([
  //   getAccountFromUserOrganization(user),
  //   getOrganizationVersionIsCR(user.organizationVersionId),
  // ])

  // return <TeamPage user={user} team={team} crOrga={isCR} />
  return <p>Team page</p>
}

export default withAuth(Team)
