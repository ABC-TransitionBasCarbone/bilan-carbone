import type { FullStudy } from '@/db/study'
import { StudyEmissionSource } from '@abc-transitionbascarbone/db-common'
import { EmissionFactorBase, Import, SubPost, Unit } from '@abc-transitionbascarbone/db-common/enums'

export const mockedEmissionSource = {
  id: 'mocked-emission-source-id',
  studyId: 'mocked-study-id',
  subPost: SubPost.Electricite,
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
  constructionYear: null,
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
  lastEditorId: null,
  feReliability: null,
  feTechnicalRepresentativeness: null,
  feGeographicRepresentativeness: null,
  feTemporalRepresentativeness: null,
  feCompleteness: null,
  feComment: null,
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
    base: EmissionFactorBase.LocationBased,
    unit: Unit.GWH,
    isMonetary: false,
    location: '',
    customUnit: null,
    versions: [
      {
        importVersionId: 'mocked-import-version-id',
        importVersion: { id: 'mocked-import-version-id', name: 'test', source: Import.BaseEmpreinte, archived: false },
      },
    ],
    metaData: [
      {
        language: 'fr',
        frontiere: 'Mocked Frontiere',
        location: 'Mocked Location',
        title: 'Mocked Emission Factor',
        attribute: 'Mocked Attribute',
        comment: 'Mocked Comment',
        tag: null,
      },
    ],
    emissionFactorParts: [],
  },
  studySite: {
    id: 'mocked-study-site-id',
    site: { name: 'Mocked Site', id: 'mocked-site-id' },
  },
  lastEditor: null,
  ...props,
})
