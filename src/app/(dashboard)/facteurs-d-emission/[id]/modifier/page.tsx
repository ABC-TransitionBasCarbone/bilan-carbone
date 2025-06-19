import withAuth from '@/components/hoc/withAuth'
import EditEmissionFactorPage from '@/components/pages/EditEmissionFactor'
import NotFound from '@/components/pages/NotFound'
import { canEditEmissionFactor } from '@/services/permissions/emissionFactor'
import { hasAccessToEmissionFactor } from '@/services/permissions/environment'
import { getDetailedEmissionFactor } from '@/services/serverFunctions/emissionFactor'
import { UserSession } from 'next-auth'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
  user: UserSession
}

const EditEmissionFactor = async (props: Props) => {
  const params = await props.params
  const emissionFactor = await getDetailedEmissionFactor(params.id)

  if (!emissionFactor || !hasAccessToEmissionFactor(props.user.environment)) {
    return <NotFound />
  }

  if (!(await canEditEmissionFactor(params.id))) {
    redirect('/facteurs-d-emission')
  }

  if (!emissionFactor.success || !emissionFactor.data) {
    return <NotFound />
  }

  return <EditEmissionFactorPage emissionFactor={emissionFactor.data} />
}

export default withAuth(EditEmissionFactor)
