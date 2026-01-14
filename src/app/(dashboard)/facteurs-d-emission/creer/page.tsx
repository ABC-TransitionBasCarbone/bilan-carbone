import withAuth from '@/components/hoc/withAuth'
import NewEmissionFactorPage from '@/components/pages/NewEmissionFactor'
import NotFound from '@/components/pages/NotFound'
import { getOrganizationVersionById } from '@/db/organization'
import { hasAccessToEmissionFactors } from '@/services/permissions/environmentAdvanced'
import { getEmissionFactorLocations } from '@/services/serverFunctions/emissionFactor'
import { hasActiveLicence } from '@/utils/organization'
import { UserSession } from 'next-auth'
import { redirect } from 'next/navigation'

interface Props {
  user: UserSession
}

const NewEmissionFactor = async ({ user }: Props) => {
  if (!user.organizationVersionId || !hasAccessToEmissionFactors(user.environment, user.level)) {
    return <NotFound />
  }

  const userOrganization = await getOrganizationVersionById(user.organizationVersionId || '')
  if (!userOrganization || !hasActiveLicence(userOrganization)) {
    redirect('/facteurs-d-emission')
  }

  const locations = await getEmissionFactorLocations()

  return <NewEmissionFactorPage locations={locations.success ? locations.data : []} />
}

export default withAuth(NewEmissionFactor)
