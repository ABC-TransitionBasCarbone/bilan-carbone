import withAuth from '@/components/hoc/withAuth'
import EditEmissionFactorPage from '@/components/pages/EditEmissionFactor'
import NotFound from '@/components/pages/NotFound'
import { canEditEmissionFactor } from '@/services/permissions/emissionFactor'
import { getDetailedEmissionFactor } from '@/services/serverFunctions/emissionFactor'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

const EditEmissionFactor = async (props: Props) => {
  const params = await props.params
  const emissionFactor = await getDetailedEmissionFactor(params.id)

  if (!emissionFactor) {
    return <NotFound />
  }

  if (!(await canEditEmissionFactor(params.id))) {
    redirect('/facteurs-d-emission')
  }

  return <EditEmissionFactorPage emissionFactor={emissionFactor} />
}

export default withAuth(EditEmissionFactor)
