// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { StudyEmissionSource, SubPost } from '@prisma/client'

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
  tag: null,
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
}

export const getMockedEmissionSource = (props?: Partial<StudyEmissionSource>): StudyEmissionSource => ({
  ...mockedDbEmissionSource,
  ...props,
})
