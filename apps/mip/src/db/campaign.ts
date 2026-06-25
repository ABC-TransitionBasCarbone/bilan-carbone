import { UpdateCampaignCommand } from '@/services/serverFunctions/campaign.command'
import { UpdateModelCampaignCommand } from '@/services/serverFunctions/modelCampaign.command'
import { Prisma } from '@abc-transitionbascarbone/db-common'
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

export const getModelCampaignByOrganizationVersionMipId = (organizationVersionMipId: string) => {
  return prismaClient.modelCampaign.findFirst({
    where: { organizationVersionMip: { id: organizationVersionMipId } },
    select: { name: true, id: true, model: true },
  })
}

export type ModelCampaignLight = AsyncReturnType<typeof getModelCampaignByOrganizationVersionMipId>

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

export const getAllCampaigns = async () => {
  const campaigns = await prismaClient.campaign.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      createdBy: { select: { id: true } },
      allowedAccounts: { select: { accountMipId: true } },
      _count: { select: { responses: true } },
      modelCampaignId: true,
    },
  })

  return campaigns
}

export type CampaignsWithResponses = AsyncReturnType<typeof getAllCampaigns>

export const getAllAllowedCampaigns = async (accountMipId: string) => {
  const campaigns = await prismaClient.campaign.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      createdBy: { select: { id: true } },
      allowedAccounts: { select: { accountMipId: true } },
      _count: { select: { responses: true } },
      modelCampaignId: true,
    },
    where: { allowedAccounts: { some: { accountMipId } } },
  })

  return campaigns
}

export const updateCampaign = async (
  command: UpdateCampaignCommand,
  accountMipId: string,
  organizationVersionMipId: string,
  isAdmin?: boolean,
) => {
  const campaignIds = command.campaigns.map((campaign) => campaign.id)

  const campaignWhereBase = {
    id: { notIn: campaignIds },
    modelCampaign: { organizationVersionMip: { id: organizationVersionMipId } },
  }

  const campaignWhere = isAdmin
    ? campaignWhereBase
    : { ...campaignWhereBase, allowedAccounts: { some: { accountMipId } } }

  const campaignsToDelete = await prismaClient.campaign.findMany({
    where: campaignWhere,
    select: { id: true },
  })
  const campaignIdsToDelete = campaignsToDelete.map((c) => c.id)

  return prismaClient.$transaction([
    prismaClient.accountOnCampaign.deleteMany({ where: { campaign: { id: { in: campaignIdsToDelete } } } }),
    prismaClient.response.deleteMany({ where: { campaign: { id: { in: campaignIdsToDelete } } } }),
    ...command.campaigns.map((campaign) =>
      prismaClient.campaign.upsert({
        where: { id: campaign.id },
        create: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          modelCampaign: { connect: { id: campaign.modelCampaignId } },
          createdBy: { connect: { id: campaign.createdBy } },
          allowedAccounts: {
            connectOrCreate: (campaign.allowedAccounts || []).map((accountMipId: string) => ({
              where: { campaignId_accountMipId: { campaignId: campaign.id, accountMipId } },
              create: { accountMipId },
            })),
          },
        },
        update: {
          name: campaign.name,
          status: campaign.status,
        },
      }),
    ),
    prismaClient.campaign.deleteMany({ where: { id: { in: campaignIdsToDelete } } }),
  ])
}

export const getCampaignById = (id: string) => {
  return prismaClient.campaign.findFirst({
    where: { id },
    select: { id: true, status: true, modelCampaign: { select: { id: true, model: true } } },
  })
}

export const createResponse = async (campaignId: string, data: Prisma.ResponseCreateInput) =>
  prismaClient.response.create({
    data: {
      ...data,
      campaign: { connect: { id: campaignId } },
    },
  })
