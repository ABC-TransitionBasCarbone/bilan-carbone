import { getDeactivableFeaturesRestrictionValues } from '@/services/serverFunctions/deactivableFeatures'
import { getMessageBannersForManagement } from '@/services/serverFunctions/messageBanner'
import Block from '@abc-transitionbascarbone/common/components/base/Block'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { getTranslations } from 'next-intl/server'
import DeactivableFeatures from '../admin/DeactivableFeatures'
import MessageBannerManagement from '../admin/MessageBannerManagement'
import SuperAdminImport from '../admin/SuperAdminImport'

interface Props {
  environment: Environment
}

const SuperAdminPage = async ({ environment }: Props) => {
  const t = await getTranslations('admin')
  const [deactivatedFeaturesRestrictions, messageBanners] = await Promise.all([
    getDeactivableFeaturesRestrictionValues(),
    getMessageBannersForManagement(),
  ])
  if (!messageBanners.success) {
    throw new Error(messageBanners.errorMessage)
  }

  return (
    <>
      <Block title={t('title')} as="h1">
        <SuperAdminImport environment={environment} />
        <MessageBannerManagement banners={messageBanners.data} />
        {deactivatedFeaturesRestrictions.success && (
          <DeactivableFeatures restrictions={deactivatedFeaturesRestrictions.data} />
        )}
      </Block>
    </>
  )
}

export default SuperAdminPage
