import * as situationDbModule from '@/db/situation'
import * as studyDbModule from '@/db/study'
import * as authModule from '@/services/auth'
import * as situationPermissionsModule from '@/services/permissions/situation'
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
  hasReadAccessOnStudy: jest.fn(),
}))

jest.mock('../permissions/situation', () => ({
  canSaveSituationOnStudy: jest.fn(),
}))

jest.mock('../permissions/check', () => ({
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
}))

const mockAuth = authModule.auth as jest.Mock
const mockDbActualizedAuth = authModule.dbActualizedAuth as jest.Mock
const mockCanSaveSituationOnStudy = jest.mocked(situationPermissionsModule.canSaveSituationOnStudy)
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

  const mockStudy = {
    id: 'study-1',
    contributors: [{ accountId: 'account-1' }],
    sites: [{ id: 'site-1' }],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns not authorized when there is no session', async () => {
    mockAuth.mockResolvedValue(null)
    mockDbActualizedAuth.mockResolvedValue(null)

    const result = await saveSituation('study-1', 'site-1', {}, {}, 'v1')

    expect(result.success).toBe(false)
    expect((result as { errorMessage: string }).errorMessage).toBe('NOT_AUTHORIZED')
  })

  it('returns not authorized when study or studySite is not found', async () => {
    mockAuth.mockResolvedValue(mockSession)
    mockDbActualizedAuth.mockResolvedValue(mockSession)
    mockGetStudyById.mockResolvedValue(null)

    const result = await saveSituation('study-1', 'site-1', {}, {}, 'v1')

    expect(result.success).toBe(false)
    expect((result as { errorMessage: string }).errorMessage).toBe('NOT_AUTHORIZED')
  })

  it('saves situation if user can save situation on study', async () => {
    mockAuth.mockResolvedValue(mockSession)
    mockDbActualizedAuth.mockResolvedValue(mockSession)
    mockGetStudyById.mockResolvedValue(mockStudy)
    mockCanSaveSituationOnStudy.mockResolvedValue(true)
    mockUpsertSituation.mockResolvedValue({ id: 'saved-situation' })

    const result = await saveSituation('study-1', 'site-1', {}, {}, 'v1')

    expect(result.success).toBe(true)
    expect(mockUpsertSituation).toHaveBeenCalledWith('site-1', {}, {}, 'v1')
  })

  it('returns not authorized if user cannot save situation on study', async () => {
    mockAuth.mockResolvedValue(mockSession)
    mockDbActualizedAuth.mockResolvedValue(mockSession)
    mockGetStudyById.mockResolvedValue(mockStudy)
    mockCanSaveSituationOnStudy.mockResolvedValue(false)

    const result = await saveSituation('study-1', 'site-1', {}, {}, 'v1')

    expect(result.success).toBe(false)
    expect((result as { errorMessage: string }).errorMessage).toBe('NOT_AUTHORIZED')
    expect(mockUpsertSituation).not.toHaveBeenCalled()
  })
})
