import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import SimplifiedStudies from '@/components/pages/SimplifiedStudies'
import { getOrganizationVersionById } from '@/db/organization'
import { hasAccessToSimplifiedStudies } from '@/services/permissions/environment'

const MyFootprints = async ({ user }: UserSessionProps) => {
  if (!user.organizationVersionId || !hasAccessToSimplifiedStudies(user.environment)) {
    return <NotFound />
  }

  const organizationVersion = await getOrganizationVersionById(user.organizationVersionId)

  if (!organizationVersion) {
    return <NotFound />
  }

  return <SimplifiedStudies organizationVersion={organizationVersion} user={user} />
}

export default withAuth(MyFootprints)
