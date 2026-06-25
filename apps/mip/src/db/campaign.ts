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

export const getModelCampaignById = (id: string) => {
  return prismaClient.modelCampaign.findFirst({
    where: { id },
    select: { name: true, id: true, organizationVersionMip: { select: { id: true } } },
  })
}

export const addOrganizationVersionMipIdToModelCampaign = async (
  modelCampaignId: string,
  organizationVersionMipId: string,
) => {
  const org = await prismaClient.organizationVersionMip.findUnique({
    where: { id: organizationVersionMipId },
  })

  if (!org) {
    throw new Error('OrganizationVersionMip not found')
  }

  return prismaClient.modelCampaign.update({
    where: { id: modelCampaignId },
    data: {
      organizationVersionMip: {
        connect: { id: organizationVersionMipId },
      },
    },
  })
}
