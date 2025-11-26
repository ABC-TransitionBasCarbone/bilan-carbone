import { FullStudy } from '@/db/study'
import { Import, StudyEmissionSource, SubPost, Unit } from '@prisma/client'

export const mockedEmissionSource = {
  id: 'mocked-emission-source-id',
  studyId: 'mocked-study-id',
  subPost: SubPost.Achats,
  studySiteId: 'mocked-site-id',
  name: 'Mocked Emission Source',
  emissionFactorId: null,
  validated: false,
}

export const mockedDbEmissionSource = {
  ...mockedEmissionSource,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  caracterisation: null,
  value: null,
  reliability: null,
  technicalRepresentativeness: null,
  geographicRepresentativeness: null,
  temporalRepresentativeness: null,
  completeness: null,
  source: null,
  type: null,
  comment: null,
  recycledPart: null,
  depreciationPeriod: null,
  duration: null,
  hectare: null,
  contributorId: null,
  feReliability: null,
  feTechnicalRepresentativeness: null,
  feGeographicRepresentativeness: null,
  feTemporalRepresentativeness: null,
  feCompleteness: null,
  emissionSourceTags: [],
} as StudyEmissionSource

export const getMockedEmissionSource = (props?: Partial<StudyEmissionSource>): StudyEmissionSource => ({
  ...mockedDbEmissionSource,
  ...props,
})

export const getMockedFullStudyEmissionSource = (
  props?: Partial<FullStudy['emissionSources'][number]>,
): FullStudy['emissionSources'][number] => ({
  ...mockedDbEmissionSource,
  emissionSourceTags: [],
  emissionFactor: {
    id: 'test',
    importedFrom: Import.Manual,
    totalCo2: 10,
    geographicRepresentativeness: 5,
    completeness: 5,
    reliability: 5,
    technicalRepresentativeness: 5,
    temporalRepresentativeness: 5,
    importedId: '4',
    unit: Unit.GWH,
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
  },
  studySite: {
    id: 'mocked-study-site-id',
    site: { name: 'Mocked Site', id: 'mocked-site-id' },
  },
  contributor: null,
  ...props,
})
