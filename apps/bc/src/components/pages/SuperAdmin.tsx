import { getDeactivableFeaturesRestrictionValues } from '@/services/serverFunctions/deactivableFeatures'
import {
  deleteMessageBannerForManagement,
  getMessageBannersForManagement,
  saveMessageBannerForManagement,
} from '@/services/serverFunctions/messageBanner'
import Block from '@abc-transitionbascarbone/common/components/base/Block'
import MessageBannerManagement from '@abc-transitionbascarbone/common/components/MessageBannerManagement'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { bcEnvironments } from '@abc-transitionbascarbone/common/utils/environments'
import { messageBannerEnvironments } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import { getTranslations } from 'next-intl/server'
import DeactivableFeatures from '../admin/DeactivableFeatures'
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
    console.error('SuperAdminPage: failed to load message banners', { error: messageBanners.errorMessage })
  }

  return (
    <>
      <Block title={t('title')} as="h1">
        <SuperAdminImport environment={environment} />
        {messageBanners.success && (
          <MessageBannerManagement
            banners={messageBanners.data}
            environments={messageBannerEnvironments}
            defaultEnvironments={bcEnvironments}
            saveBanner={saveMessageBannerForManagement}
            deleteBanner={deleteMessageBannerForManagement}
          />
        )}
        {deactivatedFeaturesRestrictions.success && (
          <DeactivableFeatures restrictions={deactivatedFeaturesRestrictions.data} />
        )}
      </Block>
    </>
  )
}

export default SuperAdminPage
