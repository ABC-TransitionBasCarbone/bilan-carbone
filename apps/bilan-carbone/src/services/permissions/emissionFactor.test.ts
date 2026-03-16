import { AccountWithUser } from '@/db/account'
import { getMockedDbAccount } from '@/tests/utils/models/user'
import { expect } from '@jest/globals'
import { EmissionFactor, Import } from '@prisma/client'
import * as emissionFactorModule from '../serverFunctions/emissionFactor'
import { canEditEmissionFactor, canReadEmissionFactor } from './emissionFactor'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('./study', () => ({ isAdminOnStudyOrga: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('../study', () => ({ hasSufficientLevel: jest.fn() }))

jest.mock('../serverFunctions/emissionFactor', () => ({ isFromEmissionFactorOrganization: jest.fn() }))
const mockIsFromEmissionFactorOrganization = emissionFactorModule.isFromEmissionFactorOrganization as jest.Mock

describe('EmissionFactor permissions service', () => {
  describe('canReadEmissionFactor', () => {
    it('returns true if emission factor is not manually imported', () => {
      const account = getMockedDbAccount({}) as AccountWithUser
      const emissionFactor = { importedFrom: Import.BaseEmpreinte } as EmissionFactor

      expect(canReadEmissionFactor(account, emissionFactor)).toBe(true)
    })

    it('returns true if manually imported and user belongs to same organization', () => {
      const account = getMockedDbAccount({ organizationVersionId: 'mocked-organization-version-id' }) as AccountWithUser
      const emissionFactor = {
        importedFrom: Import.Manual,
        organizationId: 'mocked-organization-id',
      } as EmissionFactor

      expect(canReadEmissionFactor(account, emissionFactor)).toBe(true)
    })

    it('returns false if manually imported and user belongs to different organization', () => {
      const account = getMockedDbAccount({ organizationVersionId: 'mocked-organization-version-id' }) as AccountWithUser
      const emissionFactor = {
        importedFrom: Import.Manual,
        organizationId: 'mocked-other-organization-id',
      } as EmissionFactor

      expect(canReadEmissionFactor(account, emissionFactor)).toBe(false)
    })
  })

  describe('canEditEmissionFactor', () => {
    it('User from same organization should be able to edit emission factor', async () => {
      mockIsFromEmissionFactorOrganization.mockResolvedValue({ success: true, data: true })
      const result = await canEditEmissionFactor('mocked-id')
      expect(result).toBe(true)
    })

    it('User from other organization should not be able to edit emission factor', async () => {
      mockIsFromEmissionFactorOrganization.mockResolvedValue({ success: true, data: false })
      const result = await canEditEmissionFactor('mocked-id')
      expect(result).toBe(false)
    })
  })
})
