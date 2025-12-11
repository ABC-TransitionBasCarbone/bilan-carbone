import withAuth from '@/components/hoc/withAuth'
import EditEmissionFactorPage from '@/components/pages/EditEmissionFactor'
import NotFound from '@/components/pages/NotFound'
import { getOrganizationVersionById } from '@/db/organization'
import { canEditEmissionFactor, hasAccessToEmissionFactors } from '@/services/permissions/emissionFactor'
import { hasAccessToEmissionFactor } from '@/services/permissions/environment'
import { getDetailedEmissionFactor, getEmissionFactorLocations } from '@/services/serverFunctions/emissionFactor'
import { hasActiveLicence } from '@/utils/organization'
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

  if (
    !emissionFactor ||
    !hasAccessToEmissionFactor(props.user.environment) ||
    !hasAccessToEmissionFactors(props.user.environment, props.user.level)
  ) {
    return <NotFound />
  }
  const userOrganization = await getOrganizationVersionById(props.user.organizationVersionId || '')

  if (!(await canEditEmissionFactor(params.id)) || !userOrganization || !hasActiveLicence(userOrganization)) {
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
