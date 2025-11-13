import withAuth from '@/components/hoc/withAuth'
import NewEmissionFactorPage from '@/components/pages/NewEmissionFactor'
import NotFound from '@/components/pages/NotFound'
import { hasAccessToEmissionFactor } from '@/services/permissions/environment'
import { getEmissionFactorLocations } from '@/services/serverFunctions/emissionFactor'
import { UserSession } from 'next-auth'

interface Props {
  user: UserSession
}

const NewEmissionFactor = async ({ user }: Props) => {
  if (!user.organizationVersionId || !hasAccessToEmissionFactor(user.environment)) {
    return <NotFound />
  }
  const locations = await getEmissionFactorLocations()

  return <NewEmissionFactorPage locations={locations.success ? locations.data : []} />
}

export default withAuth(NewEmissionFactor)
