import { prismaClient } from './client.server'

export const getAllModelCampaigns = async () => {

  const campaignModels = await prismaClient.modelCampaign.findMany({
    select: { id: true, name: true, model: true, organizationVersionMip: { select: { name: true, id: true } } },
  })

  return campaignModels
}

export type ModelCampaignsWithOrga = AsyncReturnType<typeof getAllModelCampaigns>