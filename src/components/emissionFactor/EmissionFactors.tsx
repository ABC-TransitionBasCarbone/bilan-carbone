'use server'

import React from 'react'
import EmissionFactorsTable from './Table'
import { getLocale } from '@/i18n/locale'
import { getEmissionFactors } from '@/services/emissionFactors'

const EmissionFactors = async () => {
  const locale = await getLocale()
  const emissionFactors = await getEmissionFactors(locale)

  return <EmissionFactorsTable emissionFactors={emissionFactors} />
}

export default EmissionFactors
