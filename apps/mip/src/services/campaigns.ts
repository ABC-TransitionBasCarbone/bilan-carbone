import {
  getAllAllowedCampaigns as getAllAllowedCampaignsFromDb,
  getAllOrganizationVersionMipCampaigns as getAllOrganizationVersionMipCampaignsFromDb,
  getCampaignById as getCampaignByIdFromDb,
} from '@/db/campaign'

type CampaignWithResponseCount = Awaited<ReturnType<typeof getAllOrganizationVersionMipCampaignsFromDb>>[number]

type CampaignWithResponses = Omit<CampaignWithResponseCount, '_count'> & { responsesCount: number }
export type CampaignsWithResponses = CampaignWithResponses[]

const addResponseCount = ({ _count, ...campaign }: CampaignWithResponseCount): CampaignWithResponses => ({
  ...campaign,
  responsesCount: _count.responses,
})

export const getAllOrganizationVersionMipCampaigns = async (organizationVersionMipId: string) =>
  (await getAllOrganizationVersionMipCampaignsFromDb(organizationVersionMipId)).map(addResponseCount)

export const getAllAllowedCampaigns = async (accountMipId: string, organizationVersionMipId: string) =>
  (await getAllAllowedCampaignsFromDb(accountMipId, organizationVersionMipId)).map(addResponseCount)

export const getCampaignById = async (id: string) => {
  const campaign = await getCampaignByIdFromDb(id)
  if (!campaign || !campaign.modelCampaign) {
    return campaign
  }

  return {
    ...campaign,
    modelCampaign: {
      id: campaign.modelCampaign.id,
      model: campaign.modelCampaign.organizationVersionMip?.modelCampaign?.model ?? campaign.modelCampaign.model,
    },
  }
}
