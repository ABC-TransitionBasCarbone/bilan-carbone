import { getMockedDbUser } from '@/tests/utils/models'
import { expect } from '@jest/globals'
import { Level, UserSource } from '@prisma/client'
import * as featuresModule from '../serverFunctions/deactivableFeatures'
import * as userModule from '../serverFunctions/user'
import { hasAccessToFormation } from './formations'

jest.mock('../serverFunctions/deactivableFeatures', () => ({ isDeactivableFeatureActive: jest.fn() }))
jest.mock('../serverFunctions/user', () => ({ getUserSource: jest.fn() }))

const mockIsFeatureActive = featuresModule.isDeactivableFeatureActive as jest.Mock
const mockGetUserSource = userModule.getUserSource as jest.Mock

describe('Formation permissions service', () => {
  describe('hasAccessToFormation', () => {
    describe('active feature', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        mockIsFeatureActive.mockResolvedValue(true)
        mockGetUserSource.mockResolvedValue(UserSource.CRON)
      })

      it('"Advanced" level user should be able to access the formation view', async () => {
        const user = getMockedDbUser({ level: Level.Advanced })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(true)
      })

      it('"Standard" level user should be able to access the formation view', async () => {
        const user = getMockedDbUser({ level: Level.Standard })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(true)
      })

      it('"Initial" level user should be able to access the formation view', async () => {
        const user = getMockedDbUser({ level: Level.Initial })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(true)
      })

      it('Untrained user should not be able to access the formation view', async () => {
        const user = getMockedDbUser({ level: null })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })
    })

    describe('inactive feature', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        mockIsFeatureActive.mockResolvedValue(false)
        mockGetUserSource.mockResolvedValue(UserSource.CRON)
      })

      it('"Advanced" level user should not be able to access the formation view', async () => {
        const user = getMockedDbUser({ level: Level.Advanced })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })

      it('"Standard" level user should not be able to access the formation view', async () => {
        const user = getMockedDbUser({ level: Level.Standard })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })

      it('"Initial" level user should not be able to access the formation view', async () => {
        const user = getMockedDbUser({ level: Level.Initial })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })

      it('Untrained user should not be able to access the formation view', async () => {
        const user = getMockedDbUser({ level: null })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })
    })

    describe('other users', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        mockIsFeatureActive.mockResolvedValue(true)
      })

      it('User should not be able to access the formation view', async () => {
        mockGetUserSource.mockResolvedValue(null)
        const user = getMockedDbUser({ level: Level.Advanced })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })

      it('Foreign users should not be able to access the formation view', async () => {
        mockGetUserSource.mockResolvedValue(UserSource.TUNISIE)
        const user = getMockedDbUser({ level: Level.Advanced })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })
    })
  })
})
