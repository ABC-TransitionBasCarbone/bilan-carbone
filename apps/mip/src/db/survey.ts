import { prismaClient } from './client.server'

export const getResponsesByCampaignId = (campaignId: string) =>
  prismaClient.response.findMany({
    where: { campaignId },
    select: { answers: true },
  })

export const getCampaignWithModelForSurvey = (campaignId: string) =>
  prismaClient.campaign.findFirst({
    where: { id: campaignId },
    select: { modelCampaign: { select: { model: true } } },
  })
