import { getMockedDbUser } from '@/tests/utils/models/user'
import { expect } from '@jest/globals'
import { EmissionFactor, Import, User } from '@prisma/client'
import * as emissionFactorModule from '../serverFunctions/emissionFactor'
import { canEditEmissionFactor, canReadEmissionFactor } from './emissionFactor'

jest.mock('../serverFunctions/emissionFactor', () => ({ isFromEmissionFactorOrganization: jest.fn() }))
const mockIsFromEmissionFactorOrganization = emissionFactorModule.isFromEmissionFactorOrganization as jest.Mock

describe('EmissionFactor permissions service', () => {
  describe('canReadEmissionFactor', () => {
    it('returns true if emission factor is not manually imported', () => {
      const user = getMockedDbUser({}) as User
      const emissionFactor = { importedFrom: Import.BaseEmpreinte } as EmissionFactor

      expect(canReadEmissionFactor(user, emissionFactor)).toBe(true)
    })

    it('returns true if manually imported and user belongs to same organization', () => {
      const user = getMockedDbUser({ organizationId: 'mocked-organization-id' }) as User
      const emissionFactor = {
        importedFrom: Import.Manual,
        organizationId: 'mocked-organization-id',
      } as EmissionFactor

      expect(canReadEmissionFactor(user, emissionFactor)).toBe(true)
    })

    it('returns false if manually imported and user belongs to different organization', () => {
      const user = getMockedDbUser({ organizationId: 'mocked-organization-id' }) as User
      const emissionFactor = {
        importedFrom: Import.Manual,
        organizationId: 'mocked-other-organization-id',
      } as EmissionFactor

      expect(canReadEmissionFactor(user, emissionFactor)).toBe(false)
    })
  })

  describe('canEditEmissionFactor', () => {
    it('User from same organization should be able to edit emission factor', async () => {
      mockIsFromEmissionFactorOrganization.mockResolvedValue(true)
      const result = await canEditEmissionFactor('mocked-id')
      expect(result).toBe(true)
    })

    it('User from other organization should not be able to edit emission factor', async () => {
      mockIsFromEmissionFactorOrganization.mockResolvedValue(false)
      const result = await canEditEmissionFactor('mocked-id')
      expect(result).toBe(false)
    })
  })
})
