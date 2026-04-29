import { Environment } from '@repo/db-common/enums'
import { canSaveSituationOnStudy, isSimplifiedContributor } from './situation'
import * as studyPermissionsModule from './study'

jest.mock('./study', () => ({
  hasEditAccessOnStudy: jest.fn(),
}))

const mockHasEditAccessOnStudy = jest.mocked(studyPermissionsModule.hasEditAccessOnStudy)

describe('isSimplifiedContributor', () => {
  const mockStudy: Parameters<typeof isSimplifiedContributor>[0] = {
    contributors: [{ accountId: 'account-1' }],
  }

  it('returns true when clickson user is a contributor on the study', () => {
    const session = {
      user: {
        accountId: 'account-1',
        environment: Environment.CLICKSON,
      } as Parameters<typeof isSimplifiedContributor>[1]['user'],
    }

    expect(isSimplifiedContributor(mockStudy, session)).toBe(true)
  })

  it('returns false when clickson user is not a contributor on the study', () => {
    const session = {
      user: {
        accountId: 'other-account',
        environment: Environment.CLICKSON,
      } as Parameters<typeof isSimplifiedContributor>[1]['user'],
    }

    expect(isSimplifiedContributor(mockStudy, session)).toBe(false)
  })

  it('returns false when non-clickson user is a contributor on the study', () => {
    const session = {
      user: {
        accountId: 'account-1',
        environment: Environment.CUT,
      } as Parameters<typeof isSimplifiedContributor>[1]['user'],
    }

    expect(isSimplifiedContributor(mockStudy, session)).toBe(false)
  })
})

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
  })

  it('returns true when user has edit access regardless of environment', async () => {
    mockHasEditAccessOnStudy.mockResolvedValue(true)

    const result = await canSaveSituationOnStudy('study-1', mockStudy, clicksonSession)

    expect(result).toBe(true)
  })

  it('returns true when non-clickson user has edit access', async () => {
    mockHasEditAccessOnStudy.mockResolvedValue(true)

    const result = await canSaveSituationOnStudy('study-1', mockStudy, {
      user: { ...clicksonSession.user, environment: Environment.CUT },
    })

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
