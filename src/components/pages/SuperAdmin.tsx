'use server'

import { NOT_AUTHORIZED } from '@/services/permissions/check'
import { getDeactivableFeaturesStatuses } from '@/services/serverFunctions/deactivableFeatures'
import { getTranslations } from 'next-intl/server'
import DeactivableFeatures from '../admin/DeactivableFeatures'
import SuperAdminImport from '../admin/SuperAdminImport'
import Block from '../base/Block'

const SuperAdminPage = async () => {
  const t = await getTranslations('admin')
  const deactivableFeatures = await getDeactivableFeaturesStatuses()
  return (
    <>
      <Block title={t('title')} as="h1">
        <SuperAdminImport />
        {deactivableFeatures !== NOT_AUTHORIZED && <DeactivableFeatures featuresStatuses={deactivableFeatures} />}
      </Block>
    </>
  )
}

export default SuperAdminPage
