'use server'

import { getLocale } from '@/i18n/locale'
import { getEmissionFactors } from '@/services/emissionFactors'
import EmissionFactorsTable from './Table'

const EmissionFactors = async () => {
  const locale = await getLocale()
  const emissionFactors = await getEmissionFactors(locale)

  return <EmissionFactorsTable emissionFactors={emissionFactors} />
}

export default EmissionFactors
