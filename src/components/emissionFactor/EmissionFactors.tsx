'use server'

import { getLocale } from '@/i18n/locale'
import { getEmissionFactors } from '@/services/emissionFactors'
import EmissionFactorsTable from './Table'

interface Props {
  userOrganizationId: string | null
}

const EmissionFactors = async ({ userOrganizationId }: Props) => {
  const locale = await getLocale()
  const emissionFactors = await getEmissionFactors(locale)

  return <EmissionFactorsTable emissionFactors={emissionFactors} userOrganizationId={userOrganizationId} />
}

export default EmissionFactors
