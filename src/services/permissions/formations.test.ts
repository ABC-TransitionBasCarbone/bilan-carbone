import { getMockedAuthUser } from '@/tests/utils/models/user'
import { expect } from '@jest/globals'
import { Environment, Level, UserSource } from '@prisma/client'
import * as featuresModule from '../serverFunctions/deactivableFeatures'
import * as userModule from '../serverFunctions/user'
import { hasAccessToFormation, hasLevelForFormation } from './formations'

jest.mock('../serverFunctions/deactivableFeatures', () => ({
  isDeactivableFeatureActive: jest.fn(),
  getDeactivableFeatureRestrictions: jest.fn(),
}))
jest.mock('../serverFunctions/user', () => ({ getUserSource: jest.fn() }))

const mockIsFeatureActive = featuresModule.isDeactivableFeatureActive as jest.Mock
const mockGetDeactivableFeatureRestrictions = featuresModule.getDeactivableFeatureRestrictions as jest.Mock
const mockGetUserSource = userModule.getUserSource as jest.Mock

describe('Formation permissions service', () => {
  describe('hasLevelForFormation', () => {
    it('"Advanced" level user should be able to access the formation view', async () => {
      const user = getMockedAuthUser({ level: Level.Advanced })
      expect(hasLevelForFormation(user)).toBe(true)
    })

    it('"Standard" level user should be able to access the formation view', async () => {
      const user = getMockedAuthUser({ level: Level.Standard })
      expect(hasLevelForFormation(user)).toBe(true)
    })

    it('"Initial" level user should be able to access the formation view', async () => {
      const user = getMockedAuthUser({ level: Level.Initial })
      expect(hasLevelForFormation(user)).toBe(true)
    })

    it('Untrained user should not be able to access the formation view', async () => {
      const user = getMockedAuthUser({ level: null })
      expect(hasLevelForFormation(user)).toBe(false)
    })
  })

  describe('hasAccessToFormation', () => {
    describe('inactive feature', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        mockIsFeatureActive.mockResolvedValue(false)
        mockGetUserSource.mockResolvedValue({ success: true, data: UserSource.CRON })
      })

      it('"Advanced" level user should not be able to access the formation view', async () => {
        const user = getMockedAuthUser({ level: Level.Advanced })
        const result = await hasAccessToFormation(user.environment)
        expect(result).toBe(false)
      })

      it('"Standard" level user should not be able to access the formation view', async () => {
        const user = getMockedAuthUser({ level: Level.Standard })
        const result = await hasAccessToFormation(user.environment)
        expect(result).toBe(false)
      })

      it('"Initial" level user should not be able to access the formation view', async () => {
        const user = getMockedAuthUser({ level: Level.Initial })
        const result = await hasAccessToFormation(user.environment)
        expect(result).toBe(false)
      })

      it('Untrained user should not be able to access the formation view', async () => {
        const user = getMockedAuthUser({ level: null })
        const result = await hasAccessToFormation(user.environment)
        expect(result).toBe(false)
      })
    })

    describe('other users', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        mockIsFeatureActive.mockResolvedValue(true)
        mockGetDeactivableFeatureRestrictions.mockResolvedValue({
          deactivatedSources: [UserSource.TUNISIE],
          deactivatedEnvironments: [Environment.CUT],
        })
      })

      it('User from restricted source should not be able to access the formation view', async () => {
        mockGetUserSource.mockResolvedValue({ success: true, data: UserSource.TUNISIE })
        const user = getMockedAuthUser({ level: Level.Standard })
        const result = await hasAccessToFormation(user.environment)
        expect(result).toBe(false)
      })

      it('User from restricted environment should not be able to access the formation view', async () => {
        mockGetUserSource.mockResolvedValue({ success: true, data: UserSource.CRON })
        const user = getMockedAuthUser({ level: Level.Standard, environment: Environment.CUT })
        const result = await hasAccessToFormation(user.environment)
        expect(result).toBe(false)
      })
    })
  })
})
