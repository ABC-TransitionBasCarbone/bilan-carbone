import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import OrganizationPage from '@/components/pages/Organization'
import { getAccountOrganizations } from '@/db/account'

const Organisation = async ({ user }: UserSessionProps) => {
  if (!user.organizationId) {
    return <NotFound />
  }
  const organizations = await getAccountOrganizations(user.accountId)
  return <OrganizationPage organization={organizations[0]} user={user} />
}

export default withAuth(Organisation)
