import {
  getAllAllowedCampaigns as getAllAllowedCampaignsFromDb,
  getAllOrganizationVersionMipCampaigns as getAllOrganizationVersionMipCampaignsFromDb,
  getCampaignById as getCampaignByIdFromDb,
} from '@/db/campaign'
import { CampaignStatus } from '@abc-transitionbascarbone/common/db/enums'
import { expect } from '@jest/globals'
import { getAllAllowedCampaigns, getAllOrganizationVersionMipCampaigns, getCampaignById } from './campaigns'

jest.mock('@/db/campaign', () => ({
  getAllAllowedCampaigns: jest.fn(),
  getAllOrganizationVersionMipCampaigns: jest.fn(),
  getCampaignById: jest.fn(),
}))

const mockGetAllowedCampaigns = getAllAllowedCampaignsFromDb as jest.Mock
const mockGetOrganizationCampaigns = getAllOrganizationVersionMipCampaignsFromDb as jest.Mock
const mockGetCampaignById = getCampaignByIdFromDb as jest.Mock

describe('campaign service mappings', () => {
  beforeEach(() => jest.clearAllMocks())

  it('maps Prisma response counts for organization campaigns', async () => {
    mockGetOrganizationCampaigns.mockResolvedValue([{ id: 'campaign-id', _count: { responses: 3 } }])

    await expect(getAllOrganizationVersionMipCampaigns('organization-id')).resolves.toEqual([
      { id: 'campaign-id', responsesCount: 3 },
    ])
  })

  it('maps Prisma response counts for allowed campaigns', async () => {
    mockGetAllowedCampaigns.mockResolvedValue([{ id: 'campaign-id', _count: { responses: 2 } }])

    await expect(getAllAllowedCampaigns('account-id', 'organization-id')).resolves.toEqual([
      { id: 'campaign-id', responsesCount: 2 },
    ])
  })

  it('uses the organization model campaign when available', async () => {
    mockGetCampaignById.mockResolvedValue({
      id: 'campaign-id',
      status: CampaignStatus.OPEN,
      modelCampaign: {
        id: 'model-campaign-id',
        model: { source: 'default' },
        organizationVersionMip: { modelCampaign: { model: { source: 'organization' } } },
      },
    })

    const campaign = await getCampaignById('campaign-id')

    expect(campaign?.modelCampaign?.model).toEqual({ source: 'organization' })
  })
})
