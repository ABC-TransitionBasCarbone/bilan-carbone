import withAuth from '@/components/hoc/withAuth'
import EmissionsFactorPage from '@/components/pages/EmissionFactors'
import NotFound from '@/components/pages/NotFound'
import { getOrganizationVersionById } from '@/db/organization'
import { UserSession } from 'next-auth'

interface Props {
  user: UserSession
}

const EmissionFactors = async ({ user }: Props) => {
  const userOrganizationVersion = await getOrganizationVersionById(user.organizationVersionId)

  if (!userOrganizationVersion) {
    return <NotFound />
  }

  return <EmissionsFactorPage userOrganizationId={userOrganizationVersion.organizationId} />
}

export default withAuth(EmissionFactors)
