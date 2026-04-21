import { Environment } from '@repo/db-common/enums'
import { canSaveSituationOnStudy } from './situation'
import * as studyPermissionsModule from './study'

jest.mock('./study', () => ({
  hasEditAccessOnStudy: jest.fn(),
}))

const mockHasEditAccessOnStudy = studyPermissionsModule.hasEditAccessOnStudy as jest.Mock

describe('canSaveSituationOnStudy', () => {
  const mockStudy: Parameters<typeof canSaveSituationOnStudy>[1] = {
    contributors: [{ accountId: 'account-1' }],
  }

  const clicksonSession: Parameters<typeof canSaveSituationOnStudy>[2] = {
    user: {
      accountId: 'account-1',
      environment: Environment.CLICKSON,
    } as Parameters<typeof canSaveSituationOnStudy>[2]['user'],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHasEditAccessOnStudy.mockResolvedValue(true)
  })

  it('returns true when user has edit access', async () => {
    const result = await canSaveSituationOnStudy('study-1', mockStudy, clicksonSession)

    expect(result).toBe(true)
  })

  it('returns true when clickson contributor has no edit access', async () => {
    mockHasEditAccessOnStudy.mockResolvedValue(false)

    const result = await canSaveSituationOnStudy('study-1', mockStudy, clicksonSession)

    expect(result).toBe(true)
  })

  it('returns false when clickson user is not contributor and has no edit access', async () => {
    mockHasEditAccessOnStudy.mockResolvedValue(false)

    const result = await canSaveSituationOnStudy(
      'study-1',
      { contributors: [{ accountId: 'other-account' }] },
      clicksonSession,
    )

    expect(result).toBe(false)
  })

  it('returns false when non-clickson user has no edit access', async () => {
    mockHasEditAccessOnStudy.mockResolvedValue(false)

    const result = await canSaveSituationOnStudy('study-1', mockStudy, {
      user: { ...clicksonSession.user, environment: Environment.CUT },
    })

    expect(result).toBe(false)
  })
})
