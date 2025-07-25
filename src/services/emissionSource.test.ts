import { FullStudy } from '@/db/study'
import { expect } from '@jest/globals'
import { SubPost, Unit } from '@prisma/client'
import { getEmissionResults } from './emissionSource'

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
    importedFrom: 'BaseEmpreinte',
    importedId: '123',
    isMonetary: false,
  },
  studySite: { id: 'siteId', site: { id: 'siteId', name: 'mocked-site' } },
  emissionFactorId: 'emissionFactor',
  name: 'name',
  source: null,
  subPost: SubPost.AchatsDeServices,
  type: null,
  validated: null,
  value: 12,
  reliability: 5,
  technicalRepresentativeness: 1,
  temporalRepresentativeness: 2,
  geographicRepresentativeness: 4,
  completeness: null,
  feReliability: 5,
  feTechnicalRepresentativeness: 3,
  feTemporalRepresentativeness: 1,
  feGeographicRepresentativeness: null,
  feCompleteness: null,
  contributor: null,
  depreciationPeriod: null,
  duration: null,
  hectare: null,
  emissionSourceTag: null,
} satisfies FullStudy['emissionSources'][0]

describe('emissionSource Service', () => {
  describe('getEmissionResults', () => {
    it('should compute all values', () => {
      const result = getEmissionResults(defaultEmissionSource)
      expect(result).toEqual({
        emission: 1200,
        confidenceInterval: [516.2597423212065, 2789.2936093088983],
        alpha: 1.3244113410907485,
        standardDeviation: 2.3244113410907485,
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
