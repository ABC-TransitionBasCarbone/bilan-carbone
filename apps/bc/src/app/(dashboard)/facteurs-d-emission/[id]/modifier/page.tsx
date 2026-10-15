import withAuth from '@/components/hoc/withAuth'
import EditEmissionFactorPage from '@/components/pages/EditEmissionFactor'
import { canEditEmissionFactor } from '@/services/permissions/emissionFactor'
import { hasAccessToEmissionFactors } from '@/services/permissions/environmentAdvanced'
import { getDetailedEmissionFactor, getEmissionFactorLocations } from '@/services/serverFunctions/emissionFactor'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'
import { UserSession } from 'next-auth'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
  user: UserSession
}

const EditEmissionFactor = async (props: Props) => {
  const params = await props.params
  const [emissionFactor, locations] = await Promise.all([
    getDetailedEmissionFactor(params.id),
    getEmissionFactorLocations(),
  ])

  if (!emissionFactor || !hasAccessToEmissionFactors(props.user.environment, props.user.level)) {
    return <NotFound />
  }
  if (!(await canEditEmissionFactor(params.id))) {
    redirect('/facteurs-d-emission')
  }

  if (!emissionFactor.success || !emissionFactor.data) {
    return <NotFound />
  }

  return (
    <EditEmissionFactorPage emissionFactor={emissionFactor.data} locations={locations.success ? locations.data : []} />
  )
}

export default withAuth(EditEmissionFactor)
