import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import OrganizationPage from '@/components/pages/Organization'
import { getAccountOrganizationVersions } from '@/db/account'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

const Organisation = async ({ user }: UserSessionProps) => {
  if (!user.organizationVersionId) {
    return <NotFound />
  }
  const organizationVersions = await getAccountOrganizationVersions(user.accountId)
  return <OrganizationPage organizationVersion={organizationVersions[0]} user={user} />
}

export default withAuth(Organisation)
