import { EmissionSourceCaracterisation, EmissionSourceType, SubPost } from '@repo/db-common/enums'

export type ImportEmissionSourceError = {
  line: number
  key: string
  value?: string
}

export type ImportEmissionSourcesResult =
  | { success: true; count: number }
  | { success: false; errors: ImportEmissionSourceError[] }

export type PreviewEmissionSourceRow = {
  site: string
  post: string
  subPost: string
  name: string
  emissionFactorName: string
  value: string
  type: string
  tag: string
  source: string
  reliability: string
  technicalRepresentativeness: string
  geographicRepresentativeness: string
  temporalRepresentativeness: string
  completeness: string
}

export type PreviewEmissionSourcesResult =
  | { success: true; rows: PreviewEmissionSourceRow[] }
  | { success: false; errors: ImportEmissionSourceError[] }

export type ParsedEmissionSourceRow = {
  siteName: string
  subPost: SubPost
  name: string
  emissionFactorName: string
  emissionFactorValue: number
  emissionFactorUnit: string
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
}

export type ParseEmissionSourcesResult =
  | { success: true; rows: ParsedEmissionSourceRow[] }
  | { success: false; errors: ImportEmissionSourceError[] }

export const SOURCE_IMPORT_COLUMNS = {
  site: 0,
  post: 1,
  subPost: 2,
  name: 3,
  tag: 4,
  caracterisation: 5,
  value: 6,
  reliability: 10,
  technicalRepresentativeness: 11,
  geographicRepresentativeness: 12,
  temporalRepresentativeness: 13,
  completeness: 14,
  source: 15,
  type: 16,
  comment: 17,
  emissionFactorName: 18,
  emissionFactorValue: 19,
  emissionFactorUnit: 20,
  feComment: 29,
} as const
