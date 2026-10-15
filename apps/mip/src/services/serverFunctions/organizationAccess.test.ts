import { getAllOrganizationVersionMipCampaigns, syncCampaigns } from '@/db/campaign'
import { getSurveyCampaignForCsvExport, getSurveyCampaignForResults } from '@/db/survey'
import { auth, dbActualizedAuth } from '@/services/auth'
import { getMockedDbActualizedAuth } from '@/tests/utils/models/user'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { expect } from '@jest/globals'
import { updateCampaignCommand } from './campaign'
import { exportSurveyResponsesToCSV, getSurveyResults } from './survey'

jest.mock('@/services/auth', () => ({ auth: jest.fn(), dbActualizedAuth: jest.fn() }))
jest.mock('@/db/accountMip', () => ({ getAccountMipFromUserOrganization: jest.fn() }))
jest.mock('@/db/organization', () => ({ getOrgNameByOrgVersionMipId: jest.fn() }))
jest.mock('@/db/campaign', () => ({
  getAllOrganizationVersionMipCampaigns: jest.fn(),
  syncCampaigns: jest.fn(),
  updateModelCampaign: jest.fn(),
  createResponse: jest.fn(),
}))
jest.mock('@/db/survey', () => ({
  getSurveyCampaignForCsvExport: jest.fn(),
  getSurveyCampaignForResults: jest.fn(),
}))
jest.mock('@abc-transitionbascarbone/common/services/email/email', () => ({
  sendCampaignCreatedByCollaboratorEmail: jest.fn(),
}))
jest.mock('@abc-transitionbascarbone/common/utils/serverResponse', () => ({
  logServerFunctionCall: jest.fn(),
}))

describe('campaign access without an organization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const session = getMockedDbActualizedAuth({}, { organizationVersionMipId: null })
    jest.mocked(auth).mockResolvedValue(session)
    jest.mocked(dbActualizedAuth).mockResolvedValue(session)
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('rejects campaign updates before querying or mutating campaigns', async () => {
    const result = await updateCampaignCommand({ campaigns: [] })

    expect(result).toEqual({ success: false, errorMessage: NOT_AUTHORIZED })
    expect(getAllOrganizationVersionMipCampaigns).not.toHaveBeenCalled()
    expect(syncCampaigns).not.toHaveBeenCalled()
  })

  it('returns no survey results without querying campaigns', async () => {
    expect(await getSurveyResults('campaign-id')).toBeNull()
    expect(getSurveyCampaignForResults).not.toHaveBeenCalled()
  })

  it('rejects CSV exports before querying campaign responses', async () => {
    const result = await exportSurveyResponsesToCSV('campaign-id')

    expect(result).toEqual({ success: false, errorMessage: NOT_AUTHORIZED })
    expect(getSurveyCampaignForCsvExport).not.toHaveBeenCalled()
  })
})
