import withAuth from '@/components/hoc/withAuth'
import NewEmissionFactorPage from '@/components/pages/NewEmissionFactor'
import { canCreateEmissionFactor } from '@/services/permissions/emissionFactor.server'
import { hasAccessToEmissionFactors } from '@/services/permissions/environmentAdvanced'
import { getEmissionFactorLocations } from '@/services/serverFunctions/emissionFactor'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'
import { UserSession } from 'next-auth'

interface Props {
  user: UserSession
}

const NewEmissionFactor = async ({ user }: Props) => {
  if (!user.organizationVersionId || !hasAccessToEmissionFactors(user.environment, user.level)) {
    return <NotFound />
  }

  if (!(await canCreateEmissionFactor(user))) {
    return <NotFound />
  }

  const locations = await getEmissionFactorLocations()

  return <NewEmissionFactorPage locations={locations.success ? locations.data : []} />
}

export default withAuth(NewEmissionFactor)
