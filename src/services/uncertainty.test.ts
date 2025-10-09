import { expect } from '@jest/globals'
import { getQualityRating, getQualityStandardDeviation } from './uncertainty'

jest.mock('./file', () => ({ download: jest.fn() }))
jest.mock('./permissions/study', () => ({ isAdminOnStudyOrga: jest.fn() }))
jest.mock('./study', () => ({ hasSufficientLevel: jest.fn() }))

describe('Uncertainty Service', () => {
  describe('getQualityStandardDeviation', () => {
    it('should return null if no quality is present', () => {
      const result = getQualityStandardDeviation({
        completeness: null,
        geographicRepresentativeness: null,
        reliability: null,
        technicalRepresentativeness: null,
        temporalRepresentativeness: null,
      })
      expect(result).toBe(null)
    })

    it('should compute standard deviation based on available inputs', () => {
      const result = getQualityStandardDeviation({
        completeness: 4,
        geographicRepresentativeness: 3,
        reliability: null,
        technicalRepresentativeness: null,
        temporalRepresentativeness: null,
      })
      expect(result).toBe(1.0284009745979465)
    })

    it('should compute standard deviation based on all inputs', () => {
      const result = getQualityStandardDeviation({
        completeness: 4,
        geographicRepresentativeness: 3,
        reliability: 2,
        technicalRepresentativeness: 1,
        temporalRepresentativeness: 5,
      })
      expect(result).toBe(2.0488353976695466)
    })
  })

  describe('getQualityRating', () => {
    it('should return null if no quality is present', () => {
      const result = getQualityRating({
        completeness: null,
        geographicRepresentativeness: null,
        reliability: null,
        technicalRepresentativeness: null,
        temporalRepresentativeness: null,
      })
      expect(result).toBe(null)
    })

    it('should return score based on the quality', () => {
      const result = getQualityRating({
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
