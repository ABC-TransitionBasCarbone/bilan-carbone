import { expect } from '@jest/globals'
import { getQualitativeUncertaintyFromQuality, getSquaredStandardDeviationForQuality } from './uncertainty'

jest.mock('./file', () => ({ download: jest.fn() }))
jest.mock('./permissions/study.utils', () => ({ isAdminOnStudyOrga: jest.fn() }))
jest.mock('./study', () => ({ hasSufficientLevel: jest.fn() }))

describe('Uncertainty Service', () => {
  describe('getSquaredStandardDeviationForQuality', () => {
    it('should return worst standard deviation if no quality is present', () => {
      const result = getSquaredStandardDeviationForQuality({
        completeness: null,
        geographicRepresentativeness: null,
        reliability: null,
        technicalRepresentativeness: null,
        temporalRepresentativeness: null,
      })
      expect(result).toBe(2.5163566012590954)
    })

    it('should compute standard deviation based on available inputs', () => {
      const result = getSquaredStandardDeviationForQuality({
        completeness: 4,
        geographicRepresentativeness: 3,
        reliability: null,
        technicalRepresentativeness: null,
        temporalRepresentativeness: null,
      })
      expect(result).toBe(2.459659422059095)
    })

    it('should compute standard deviation based on all inputs', () => {
      const result = getSquaredStandardDeviationForQuality({
        completeness: 4,
        geographicRepresentativeness: 3,
        reliability: 2,
        technicalRepresentativeness: 1,
        temporalRepresentativeness: 5,
      })
      expect(result).toBe(2.0488353976695466)
    })
  })

  describe('getQualitativeUncertaintyFromQuality', () => {
    it('should return worst case scenario if no quality is present', () => {
      const result = getQualitativeUncertaintyFromQuality({
        completeness: null,
        geographicRepresentativeness: null,
        reliability: null,
        technicalRepresentativeness: null,
        temporalRepresentativeness: null,
      })
      expect(result).toBe(1)
    })

    it('should return score based on the quality', () => {
      const result = getQualitativeUncertaintyFromQuality({
        completeness: 4,
        geographicRepresentativeness: 3,
        reliability: 2,
        technicalRepresentativeness: 1,
        temporalRepresentativeness: 5,
      })
      expect(result).toBe(2)
    })
  })
})
