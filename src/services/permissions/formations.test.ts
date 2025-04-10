import { getMockedDbUser } from '@/tests/utils/models'
import { expect } from '@jest/globals'
import { Level } from '@prisma/client'
import * as featuresModule from '../serverFunctions/deactivableFeatures'
import { hasAccessToFormation } from './formations'

jest.mock('../serverFunctions/deactivableFeatures', () => ({ isFeatureActive: jest.fn() }))

const mockIsFeatureActive = featuresModule.isFeatureActive as jest.Mock

describe('Formation permissions service', () => {
  describe('hasAccessToFormation', () => {
    describe('active feature', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        mockIsFeatureActive.mockResolvedValue(true)
      })

      it('"Advanced" level user should not be able to access the formation view', async () => {
        const user = getMockedDbUser({ level: Level.Advanced })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(true)
      })

      it('"Standard" level user should not be able to access the formation view', async () => {
        const user = getMockedDbUser({ level: Level.Standard })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(true)
      })

      it('"Initial" level user should not be able to access the formation view', async () => {
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
      })

      it('"Advanced" level user should be able to access the formation view', async () => {
        const user = getMockedDbUser({ level: Level.Advanced })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })

      it('"Standard" level user should be able to access the formation view', async () => {
        const user = getMockedDbUser({ level: Level.Standard })
        const result = await hasAccessToFormation(user)
        expect(result).toBe(false)
      })

      it('"Initial" level user should be able to access the formation view', async () => {
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
  })
})
