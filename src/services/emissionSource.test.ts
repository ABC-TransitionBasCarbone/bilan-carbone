import { expect } from '@jest/globals'
import { getEmissionResults } from './emissionSource'
import { FullStudy } from '@/db/study'
import { SubPost, Unit } from '@prisma/client'

const defaultEmissionSource = {
  id: 'random',
  caracterisation: null,
  comment: null,
  emissionFactor: {
    id: 'random',
    unit: Unit.A4_SHEET_100,
    totalCo2: 100,
    reliability: 5,
    technicalRepresentativeness: 3,
    temporalRepresentativeness: 1,
    geographicRepresentativeness: null,
    completeness: null,
  },
  name: 'name',
  source: null,
  subPost: SubPost.AchatsDeServices,
  tag: null,
  type: null,
  validated: null,
  value: 12,
  reliability: 5,
  technicalRepresentativeness: 1,
  temporalRepresentativeness: 2,
  geographicRepresentativeness: 4,
  completeness: null,
} satisfies FullStudy['emissionSources'][0]

describe('emissionSource Service', () => {
  describe('getEmissionResults', () => {
    it('should compute all values', () => {
      const result = getEmissionResults(defaultEmissionSource)
      expect(result).toEqual({
        emission: 1200,
        confidenceInterval: [634.4420232775785, 2269.7109383783313],
        alpha: 0.8914257819819428,
      })
    })

    it('should return null if value is not defined', () => {
      const result = getEmissionResults({
        ...defaultEmissionSource,
        value: null,
      })
      expect(result).toBe(null)
    })

    it('should return null if emission factor is not defined', () => {
      const result = getEmissionResults({
        ...defaultEmissionSource,
        emissionFactor: null,
      })
      expect(result).toBe(null)
    })
  })
})
