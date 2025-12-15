import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import OrganizationPage from '@/components/pages/Organization'
import { getAccountOrganizationVersions } from '@/db/account'
import { hasAccessToStudies } from '@/services/permissions/environmentExtended'

const Organisation = async ({ user }: UserSessionProps) => {
  if (!user.organizationVersionId || !hasAccessToStudies(user.environment, user.level)) {
    return <NotFound />
  }
  const organizationVersions = await getAccountOrganizationVersions(user.accountId)
  return <OrganizationPage organizationVersion={organizationVersions[0]} user={user} />
}

export default withAuth(Organisation)
