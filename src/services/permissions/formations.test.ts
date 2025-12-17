import * as organizationDb from '@/db/organization'
import { getMockedAuthUser } from '@/tests/utils/models/user'
import * as organizationUtils from '@/utils/organization'
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
jest.mock('@/db/organization', () => ({ getOrganizationVersionById: jest.fn() }))
jest.mock('@/utils/organization', () => ({ hasActiveLicenceForFormation: jest.fn() }))

const mockIsFeatureActive = featuresModule.isDeactivableFeatureActive as jest.Mock
const mockGetDeactivableFeatureRestrictions = featuresModule.getDeactivableFeatureRestrictions as jest.Mock
const mockGetUserSource = userModule.getUserSource as jest.Mock
const mockGetOrganizationVersionById = organizationDb.getOrganizationVersionById as jest.Mock
const mockHasActiveLicenceForFormation = organizationUtils.hasActiveLicenceForFormation as jest.Mock

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
        mockGetOrganizationVersionById.mockResolvedValue({ id: 'org-version-id' })
        mockHasActiveLicenceForFormation.mockReturnValue(true)
      })

      it('"Advanced" level user should not be able to access the formation view', async () => {
        const user = getMockedAuthUser({ level: Level.Advanced })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })

      it('"Standard" level user should not be able to access the formation view', async () => {
        const user = getMockedAuthUser({ level: Level.Standard })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })

      it('"Initial" level user should not be able to access the formation view', async () => {
        const user = getMockedAuthUser({ level: Level.Initial })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })

      it('Untrained user should not be able to access the formation view', async () => {
        const user = getMockedAuthUser({ level: null })
        const result = await hasAccessToFormation(user)
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
        mockGetOrganizationVersionById.mockResolvedValue({ id: 'org-version-id' })
        mockHasActiveLicenceForFormation.mockReturnValue(true)
      })

      it('User from restricted source should not be able to access the formation view', async () => {
        mockGetUserSource.mockResolvedValue({ success: true, data: UserSource.TUNISIE })
        const user = getMockedAuthUser({ level: Level.Standard })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })

      it('User from restricted environment should not be able to access the formation view', async () => {
        mockGetUserSource.mockResolvedValue({ success: true, data: UserSource.CRON })
        const user = getMockedAuthUser({ level: Level.Standard, environment: Environment.CUT })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })
    })
  })
})
