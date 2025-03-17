import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import OrganizationPage from '@/components/pages/Organization'
import { getUserOrganizations } from '@/db/user'

const Organisation = async ({ user }: UserProps) => {
  if (!user.organizationId) {
    return <NotFound />
  }
  const organizations = await getUserOrganizations(user.email)
  return <OrganizationPage organization={organizations[0]} user={user} />
}

export default withAuth(Organisation)
