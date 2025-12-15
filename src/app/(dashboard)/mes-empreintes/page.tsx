import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import SimplifiedStudies from '@/components/pages/SimplifiedStudies'
import { getAccountOrganizationVersions } from '@/db/account'
import { hasAccessToSimplifiedStudies } from '@/services/permissions/environment'

const MyFootprints = async ({ user }: UserSessionProps) => {
  if (!user.organizationVersionId || !hasAccessToSimplifiedStudies(user.environment)) {
    return <NotFound />
  }

  const organizationVersions = await getAccountOrganizationVersions(user.accountId)
  return <SimplifiedStudies organizationVersion={organizationVersions[0]} user={user} />
}

export default withAuth(MyFootprints)
