import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import SuperAdminPage from '@/components/pages/SuperAdmin'
import { getAllModelCampaigns } from '@/db/campaign'
import {
  deleteMessageBannerForManagement,
  getMessageBannersForManagement,
  saveMessageBannerForManagement,
} from '@/services/serverFunctions/messageBanner'
import Block from '@abc-transitionbascarbone/common/components/base/Block'
import MessageBannerManagement from '@abc-transitionbascarbone/common/components/MessageBannerManagement'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'
import { Environment, RoleMip } from '@abc-transitionbascarbone/common/db/enums'
import { messageBannerEnvironments } from '@abc-transitionbascarbone/common/utils/messageBanner.command'
import classNames from 'classnames'
import styles from './page.module.css'

const SuperAdmin = async ({ user }: UserSessionProps) => {
  if (user?.role !== RoleMip.SUPER_ADMIN) {
    return <NotFound />
  }
  const [allModelCampaigns, banners] = await Promise.all([getAllModelCampaigns(), getMessageBannersForManagement()])
  if (!banners.success) {
    console.error('SuperAdmin: failed to load message banners', { error: banners.errorMessage })
  }
  return (
    <div className={classNames('grow', styles.content)}>
      <SuperAdminPage modelCampaigns={allModelCampaigns} />
      <Block>
        {banners.success && (
          <MessageBannerManagement
            banners={banners.data}
            environments={messageBannerEnvironments}
            defaultEnvironments={[Environment.MIP]}
            saveBanner={saveMessageBannerForManagement}
            deleteBanner={deleteMessageBannerForManagement}
          />
        )}
      </Block>
    </div>
  )
}

export default withAuth(SuperAdmin)
