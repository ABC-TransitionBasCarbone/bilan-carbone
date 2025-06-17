import withAuth from '@/components/hoc/withAuth'
import EmissionsFactorPage from '@/components/pages/EmissionFactors'
import NotFound from '@/components/pages/NotFound'
import { getOrganizationVersionById } from '@/db/organization'
import { hasAccessToEmissionFactor } from '@/services/permissions/environment'
import { UserSession } from 'next-auth'

interface Props {
  user: UserSession
  searchParams: Promise<string>
}

const EmissionFactors = async ({ user, searchParams }: Props) => {
  const userOrganizationVersion = await getOrganizationVersionById(user.organizationVersionId)
  const searchParamsRes = await searchParams
  const manualOnly = Object.keys(searchParamsRes).includes('manual')

  if (!hasAccessToEmissionFactor(user.environment)) {
    return <NotFound />
  }

  return <EmissionsFactorPage userOrganizationId={userOrganizationVersion?.organizationId} manualOnly={manualOnly} />
}

export default withAuth(EmissionFactors)
