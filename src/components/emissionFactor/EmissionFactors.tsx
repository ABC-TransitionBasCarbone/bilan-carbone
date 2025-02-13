'use server'

import { getEmissionFactors } from '@/services/serverFunctions/emissionFactor'
import EmissionFactorsTable from './Table'

interface Props {
  userOrganizationId: string | null
}

const EmissionFactors = async ({ userOrganizationId }: Props) => {
  const emissionFactors = await getEmissionFactors()

  return <EmissionFactorsTable emissionFactors={emissionFactors} userOrganizationId={userOrganizationId} />
}

export default EmissionFactors
