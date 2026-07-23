import { prismaClient } from './client.server'

export const getResponsesByCampaignId = (campaignId: string) =>
  prismaClient.response.findMany({
    where: { campaignId },
    select: { answers: true },
  })

type SurveyCampaignAccess = {
  campaignId: string
  organizationVersionMipId: string
  canAccessAllOrganizationCampaigns: boolean
  accountMipId: string
}

const getAccessibleCampaignWhereClause = ({
  campaignId,
  organizationVersionMipId,
  canAccessAllOrganizationCampaigns,
  accountMipId,
}: SurveyCampaignAccess) => ({
  id: campaignId,
  modelCampaign: {
    organizationVersionMip: {
      id: organizationVersionMipId,
    },
  },
  ...(canAccessAllOrganizationCampaigns ? {} : { allowedAccounts: { some: { accountMipId } } }),
})

export const getSurveyCampaignForResults = (access: SurveyCampaignAccess) =>
  prismaClient.campaign.findFirst({
    where: getAccessibleCampaignWhereClause(access),
    select: {
      modelCampaign: {
        select: {
          model: true,
        },
      },
      responses: {
        select: {
          answers: true,
        },
      },
    },
  })

export const getSurveyCampaignForCsvExport = (access: SurveyCampaignAccess) =>
  prismaClient.campaign.findFirst({
    where: getAccessibleCampaignWhereClause(access),
    select: {
      id: true,
      name: true,
      responses: {
        select: {
          id: true,
          createdAt: true,
          answers: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      modelCampaign: {
        select: {
          model: true,
          organizationVersionMip: {
            select: {
              modelCampaign: {
                select: {
                  model: true,
                },
              },
            },
          },
        },
      },
    },
  })
