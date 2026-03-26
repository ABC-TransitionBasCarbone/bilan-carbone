'use server'

import { getDeactivableFeaturesRestrictionValues } from '@/services/serverFunctions/deactivableFeatures'
import { Environment } from '@prisma/client'
import { getTranslations } from 'next-intl/server'
import DeactivableFeatures from '../admin/DeactivableFeatures'
import SuperAdminImport from '../admin/SuperAdminImport'
import Block from '../base/Block'

interface Props {
  environment: Environment
}

const SuperAdminPage = async ({ environment }: Props) => {
  const t = await getTranslations('admin')
  const deactivatedFeaturesRestrictions = await getDeactivableFeaturesRestrictionValues()

  return (
    <>
      <Block title={t('title')} as="h1">
        <SuperAdminImport environment={environment} />
        {deactivatedFeaturesRestrictions.success && (
          <DeactivableFeatures restrictions={deactivatedFeaturesRestrictions.data} />
        )}
      </Block>
    </>
  )
}

export default SuperAdminPage
