import { expect } from '@jest/globals'
import { Environment, Import, Unit } from '@prisma/client'
import { getEmissionFactorValue, isMonetaryEmissionFactor } from './emissionFactors'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../services/file', () => ({ download: jest.fn() }))
jest.mock('../services/auth', () => ({ auth: jest.fn() }))

jest.mock('../services/permissions/study', () => ({ canReadStudy: jest.fn() }))
jest.mock('./study', () => ({ getAccountRoleOnStudy: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

describe('emissionFactors utils function', () => {
  describe('getEmissionFactorValue', () => {
    test('should return waste impact if env is BC, FE is from base empreinte and is in wasteEmissionFactors', () => {
      const emissionFactor = { importedFrom: Import.BaseEmpreinte, importedId: '34684', totalCo2: 123 }
      const env = Environment.BC

      const result = getEmissionFactorValue(emissionFactor, env)

      expect(result).toBe(41)
    })

    test('should return waste impact if env is TILT, FE is from base empreinte and is in wasteEmissionFactors', () => {
      const emissionFactor = { importedFrom: Import.BaseEmpreinte, importedId: '34684', totalCo2: 123 }
      const env = Environment.TILT

      const result = getEmissionFactorValue(emissionFactor, env)

      expect(result).toBe(41)
    })

    test('should return FE value if env is CUT, FE is from base empreinte and is in wasteEmissionFactors', () => {
      const emissionFactor = { importedFrom: Import.BaseEmpreinte, importedId: '34684', totalCo2: 123 }
      const env = Environment.CUT

      const result = getEmissionFactorValue(emissionFactor, env)

      expect(result).toBe(123)
    })

    test('should return FE value if env is BC, FE is from base empreinte but is not in wasteEmissionFactors', () => {
      const emissionFactor = { importedFrom: Import.BaseEmpreinte, importedId: '456789789787', totalCo2: 123 }
      const env = Environment.BC

      const result = getEmissionFactorValue(emissionFactor, env)

      expect(result).toBe(123)
    })

    test('should return waste impact if env is BC, FE is not from base empreinte and is in wasteEmissionFactors', () => {
      const emissionFactor = { importedFrom: Import.Legifrance, importedId: '34684', totalCo2: 123 }
      const env = Environment.BC

      const result = getEmissionFactorValue(emissionFactor, env)

      expect(result).toBe(123)
    })
  })

  describe('isMonetaryEmissionfactor', () => {
    test('should return true if FE has custom unit and is flagged as monetary', () => {
      const emissionFactor = { customUnit: '€', isMonetary: true }
      const result = isMonetaryEmissionFactor(emissionFactor)
      expect(result).toBe(true)
    })

    test('should return true if FE has monetary unit', () => {
      const emissionFactor = { unit: Unit.EURO }
      const result = isMonetaryEmissionFactor(emissionFactor)
      expect(result).toBe(true)
    })

    test('should return false if FE is not monetary', () => {
      const emissionFactor = { unit: Unit.KG }
      const result = isMonetaryEmissionFactor(emissionFactor)
      expect(result).toBe(false)
    })
  })
})
