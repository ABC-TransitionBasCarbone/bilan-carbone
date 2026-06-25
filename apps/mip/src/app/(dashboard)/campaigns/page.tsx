'use server'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import CampaignsPage from '@/components/pages/Campaigns'
import {
  getAllAllowedCampaigns,
  getAllOrganizationVersionMipCampaigns,
  getModelCampaignByOrganizationVersionMipId,
} from '@/db/campaign'
import { isAdmin } from '@/utils/user'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

const Campaigns = async ({ user }: UserSessionProps) => {
  const modelCampaign = await getModelCampaignByOrganizationVersionMipId(user.organizationVersionMipId)
  if (!modelCampaign) {
    return <NotFound />
  }
  const allCampaigns = isAdmin(user.role)
    ? await getAllOrganizationVersionMipCampaigns(user.organizationVersionMipId)
    : await getAllAllowedCampaigns(user.accountMipId, user.organizationVersionMipId)
  return <CampaignsPage campaigns={allCampaigns} modelCampaign={modelCampaign} accountMipId={user.accountMipId} />
}

export default withAuth(Campaigns)
