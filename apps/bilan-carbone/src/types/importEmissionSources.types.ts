import { EmissionSourceCaracterisation, EmissionSourceType, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { ImportError } from './import.types'

export type PreviewEmissionSourceRow = {
  site: string
  post: string
  subPost: string
  name: string
  value: string
  unit: string
  emissionFactorId: string
  emissionFactorName: string
  emissionFactorValue: string
  emissionFactorUnit: string
}

export type PreviewEmissionSourcesResult =
  | { success: true; rows: PreviewEmissionSourceRow[] }
  | { success: false; errors: ImportError[] }

export type ParsedEmissionSourceRow = {
  siteName: string
  subPost: SubPost
  name: string
  unit: string | undefined
  emissionFactorId: string | undefined
  emissionFactorName: string
  emissionFactorValue: number | undefined
  emissionFactorUnit: string | undefined
  value: number | undefined
  type: EmissionSourceType | undefined
  caracterisation: EmissionSourceCaracterisation | undefined
  tag: string | undefined
  source: string | undefined
  reliability: number | undefined
  technicalRepresentativeness: number | undefined
  geographicRepresentativeness: number | undefined
  temporalRepresentativeness: number | undefined
  completeness: number | undefined
  comment: string | undefined
  feComment: string | undefined
  validated: boolean | undefined
}

export const SOURCE_IMPORT_COLUMNS = {
  site: 0,
  post: 1,
  subPost: 2,
  name: 3,
  tag: 4,
  caracterisation: 5,
  value: 6,
  unit: 7,
  depreciationPeriod: 8,
  constructionYear: 9,
  globalUncertainty: 10,
  reliability: 11,
  technicalRepresentativeness: 12,
  geographicRepresentativeness: 13,
  temporalRepresentativeness: 14,
  completeness: 15,
  source: 16,
  type: 17,
  comment: 18,
  emissionFactorId: 19,
  emissionFactorName: 20,
  emissionFactorValue: 21,
  emissionFactorUnit: 22,
  feComment: 31,
  validation: 32,
} as const
