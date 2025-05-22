'use server'

import {
  getDeactivableFeaturesRestrictionValues,
  getDeactivableFeaturesStatuses,
} from '@/services/serverFunctions/deactivableFeatures'
import { getTranslations } from 'next-intl/server'
import DeactivableFeatures from '../admin/DeactivableFeatures'
import DeactivatedFeaturesRestrictions from '../admin/DeactivatedFeaturesRestrictions'
import SuperAdminImport from '../admin/SuperAdminImport'
import Block from '../base/Block'

const SuperAdminPage = async () => {
  const t = await getTranslations('admin')
  const [deactivableFeatures, deactivatedFeaturesRestrictions] = await Promise.all([
    getDeactivableFeaturesStatuses(),
    getDeactivableFeaturesRestrictionValues(),
  ])

  return (
    <>
      <Block title={t('title')} as="h1">
        <SuperAdminImport />
        {deactivableFeatures.success && <DeactivableFeatures featuresStatuses={deactivableFeatures.data} />}
        {deactivatedFeaturesRestrictions.success && (
          <DeactivatedFeaturesRestrictions restrictions={deactivatedFeaturesRestrictions.data} />
        )}
      </Block>
    </>
  )
}

export default SuperAdminPage
