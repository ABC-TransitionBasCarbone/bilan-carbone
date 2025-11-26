import withAuth from '@/components/hoc/withAuth'
import EmissionsFactorsPage from '@/components/pages/EmissionFactors'
import NotFound from '@/components/pages/NotFound'
import { getOrganizationVersionById } from '@/db/organization'
import { hasAccessToEmissionFactor } from '@/services/permissions/environment'
import { UserSession } from 'next-auth'

interface Props {
  user: UserSession
}

const EmissionFactors = async ({ user }: Props) => {
  const userOrganizationVersion = await getOrganizationVersionById(user.organizationVersionId)

  if (!hasAccessToEmissionFactor(user.environment)) {
    return <NotFound />
  }

  return (
    <EmissionsFactorsPage userOrganizationId={userOrganizationVersion?.organizationId} environment={user.environment} />
  )
}

export default withAuth(EmissionFactors)
