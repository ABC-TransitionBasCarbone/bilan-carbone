import type { FullStudy } from '@/db/study'
import { expect } from '@jest/globals'
import { EmissionFactorBase, Environment, SubPost, Unit } from '@repo/db-common/enums'
import { getEmissionResults } from './emissionSource'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('./file', () => ({ download: jest.fn() }))
jest.mock('./permissions/study.utils', () => ({ isAdminOnStudyOrga: jest.fn() }))
jest.mock('./study', () => ({ hasSufficientLevel: jest.fn() }))

const defaultEmissionSource = {
  id: 'random',
  caracterisation: null,
  constructionYear: null,
  comment: null,
  emissionFactor: {
    id: 'random',
    unit: Unit.A4_SHEET_100,
    totalCo2: 100,
    reliability: 5,
    technicalRepresentativeness: 3,
    temporalRepresentativeness: 1,
    geographicRepresentativeness: 5,
    completeness: 5,
    importedFrom: 'BaseEmpreinte',
    importedId: '123',
    base: EmissionFactorBase.LocationBased,
    isMonetary: false,
    location: '',
    customUnit: null,
    version: {
      id: 'version-id',
    },
    metaData: [
      {
        language: 'fr',
        frontiere: 'Mocked Frontiere',
        location: 'Mocked Location',
        title: 'Mocked Emission Factor',
        attribute: 'Mocked Attribute',
        comment: 'Mocked Comment',
      },
    ],
    emissionFactorParts: [],
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
  completeness: 5,
  feReliability: 5,
  feTechnicalRepresentativeness: 3,
  feTemporalRepresentativeness: 1,
  feGeographicRepresentativeness: null,
  feCompleteness: null,
  lastEditor: null,
  depreciationPeriod: null,
  duration: null,
  hectare: null,
  emissionSourceTags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies FullStudy['emissionSources'][0]

describe('emissionSource Service', () => {
  describe('getEmissionResults', () => {
    it('should compute all values', () => {
      const result = getEmissionResults(defaultEmissionSource, Environment.BC)
      expect(result).toEqual({
        emissionValue: 1200,
        confidenceInterval: [516.2597423212065, 2789.2936093088983],
        alpha: 1.3244113410907485,
        squaredStandardDeviation: 2.3244113410907485,
      })
    })

    it('should not be null even if value is not defined', () => {
      const result = getEmissionResults(
        {
          ...defaultEmissionSource,
          value: null,
        },
        Environment.BC,
      )
      expect(result.squaredStandardDeviation).not.toBe(null)
      expect(result.confidenceInterval).not.toBe(null)
      expect(result.alpha).not.toBe(null)
    })

    it('should not be null even if emission factor is not defined', () => {
      const result = getEmissionResults(
        {
          ...defaultEmissionSource,
          emissionFactor: null,
        },
        Environment.BC,
      )

      expect(result.squaredStandardDeviation).not.toBe(null)
      expect(result.confidenceInterval).not.toBe(null)
      expect(result.alpha).not.toBe(null)
    })
  })
})
