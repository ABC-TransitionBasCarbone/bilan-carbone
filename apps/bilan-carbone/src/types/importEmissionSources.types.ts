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
  quality: string
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
  quality: number | undefined
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
  emissionFactorName: 4,
  emissionFactorValue: 5,
  emissionFactorUnit: 6,
  value: 7,
  type: 8,
  caracterisation: 9,
  tag: 10,
  source: 11,
  quality: 12,
  comment: 13,
  feComment: 14,
} as const
