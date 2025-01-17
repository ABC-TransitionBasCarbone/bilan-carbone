'use server'

import { getLocale } from '@/i18n/locale'
import { auth } from '@/services/auth'
import { getEmissionFactors } from '@/services/emissionFactors'
import EmissionFactorsTable from './Table'

const EmissionFactors = async () => {
  const locale = await getLocale()
  const emissionFactors = await getEmissionFactors(locale)
  const userOrganizationId = (await auth())?.user.organizationId

  return <EmissionFactorsTable emissionFactors={emissionFactors} userOrganizationId={userOrganizationId as string} />
}

export default EmissionFactors
