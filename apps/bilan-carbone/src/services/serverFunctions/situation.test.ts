import * as authModule from '@/services/auth'
import * as situationDbModule from '@/db/situation'
import * as studyDbModule from '@/db/study'
import * as studyPermissionsModule from '@/services/permissions/study'
import { Environment } from '@repo/db-common/enums'
import { saveSituation } from './situation'

jest.mock('../auth', () => ({
  auth: jest.fn(),
  dbActualizedAuth: jest.fn(),
}))

jest.mock('../../db/situation', () => ({
  getSituationByStudySite: jest.fn(),
  getSituationsByStudySites: jest.fn(),
  upsertSituation: jest.fn(),
}))

jest.mock('../../db/study', () => ({
  getStudyById: jest.fn(),
}))

jest.mock('../permissions/study', () => ({
  hasEditAccessOnStudy: jest.fn(),
  hasReadAccessOnStudy: jest.fn(),
}))

jest.mock('../permissions/check', () => ({
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
}))

const mockAuth = authModule.auth as jest.Mock
const mockDbActualizedAuth = authModule.dbActualizedAuth as jest.Mock
const mockHasEditAccessOnStudy = studyPermissionsModule.hasEditAccessOnStudy as jest.Mock
const mockGetStudyById = studyDbModule.getStudyById as jest.Mock
const mockUpsertSituation = situationDbModule.upsertSituation as jest.Mock

describe('saveSituation', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      accountId: 'account-1',
      organizationVersionId: 'org-1',
      environment: Environment.CLICKSON,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue(mockSession)
    mockDbActualizedAuth.mockResolvedValue(mockSession)
    mockHasEditAccessOnStudy.mockResolvedValue(true)
    mockGetStudyById.mockResolvedValue({
      id: 'study-1',
      contributors: [{ accountId: 'account-1' }],
      sites: [{ id: 'site-1' }],
    })
    mockUpsertSituation.mockResolvedValue({ id: 'saved-situation' })
  })

  it('saves situation when user has edit access', async () => {
    const result = await saveSituation('study-1', 'site-1', {}, {}, 'v1')

    expect(result.success).toBe(true)
    expect(mockUpsertSituation).toHaveBeenCalledWith('site-1', {}, {}, 'v1')
  })

  it('saves situation for clickson contributor without edit access', async () => {
    mockHasEditAccessOnStudy.mockResolvedValue(false)

    const result = await saveSituation('study-1', 'site-1', {}, {}, 'v1')

    expect(result.success).toBe(true)
    expect(mockUpsertSituation).toHaveBeenCalledWith('site-1', {}, {}, 'v1')
  })

  it('returns not authorized when user has no edit access and is not clickson contributor', async () => {
    mockHasEditAccessOnStudy.mockResolvedValue(false)
    mockGetStudyById.mockResolvedValue({
      id: 'study-1',
      contributors: [{ accountId: 'other-account' }],
      sites: [{ id: 'site-1' }],
    })

    const result = await saveSituation('study-1', 'site-1', {}, {}, 'v1')

    expect(result.success).toBe(false)
    expect((result as { errorMessage: string }).errorMessage).toBe('NOT_AUTHORIZED')
    expect(mockUpsertSituation).not.toHaveBeenCalled()
  })

  it('returns not authorized for non-clickson contributor without edit access', async () => {
    mockDbActualizedAuth.mockResolvedValue({
      ...mockSession,
      user: { ...mockSession.user, environment: Environment.CUT },
    })
    mockAuth.mockResolvedValue({
      ...mockSession,
      user: { ...mockSession.user, environment: Environment.CUT },
    })
    mockHasEditAccessOnStudy.mockResolvedValue(false)

    const result = await saveSituation('study-1', 'site-1', {}, {}, 'v1')

    expect(result.success).toBe(false)
    expect((result as { errorMessage: string }).errorMessage).toBe('NOT_AUTHORIZED')
    expect(mockUpsertSituation).not.toHaveBeenCalled()
  })
})
