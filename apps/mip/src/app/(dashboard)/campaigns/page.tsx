'use server'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import CampaignsPage from '@/components/pages/Campaigns'
import { getAllCampaigns,  getModelCampaignByOrganizationVersionMipId } from '@/db/campaign'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

const Campaigns = async ({ user }: UserSessionProps) => {
  const modelCampaign = await getModelCampaignByOrganizationVersionMipId(user.organizationVersionMipId)
  if (!modelCampaign) {
    return <NotFound />
  }
  const allCampaigns = await getAllCampaigns()
  return <CampaignsPage campaigns={allCampaigns} modelCampaign={modelCampaign} accountMipId={user.accountMipId} />
}

export default withAuth(Campaigns)


