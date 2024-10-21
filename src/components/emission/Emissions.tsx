'use server'

import React from 'react'
import EmissionsTable from './Table'
import { getLocale } from '@/i18n/request'
import { getEmissions } from '@/services/emissions'

const Emissions = async () => {
  const locale = await getLocale()
  const emissions = await getEmissions(locale)

  return <EmissionsTable emissions={emissions} />
}

export default Emissions
