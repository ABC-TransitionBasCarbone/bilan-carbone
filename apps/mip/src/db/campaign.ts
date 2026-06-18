import { UpdateModelCampaignCommand } from '@/services/serverFunctions/modelCampaign.command'
import { prismaClient } from './client.server'

export const getAllModelCampaigns = async () => {
  const campaignModels = await prismaClient.modelCampaign.findMany({
    select: { id: true, name: true, model: true, organizationVersionMip: { select: { name: true, id: true } } },
  })

  return campaignModels
}

export type ModelCampaignsWithOrga = AsyncReturnType<typeof getAllModelCampaigns>

export const updateModelCampaign = async ({ modelCampaigns }: UpdateModelCampaignCommand) => {
  return prismaClient.$transaction([
    ...modelCampaigns.map((modelCampaign) =>
      prismaClient.modelCampaign.upsert({
        where: { id: modelCampaign.id },
        create: {
          id: modelCampaign.id,
          name: modelCampaign.name,
          model: modelCampaign.model,
        },
        update: {
          name: modelCampaign.name,
          model: modelCampaign.model,
        },
      }),
    ),
    prismaClient.modelCampaign.deleteMany({
      where: { id: { notIn: modelCampaigns.map((modelCampaign) => modelCampaign.id) } },
    }),
  ])
}
