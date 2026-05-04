import { EmissionFactorBase, SubPost, Unit } from '@repo/db-common'

export type ImportError = {
  line: number
  key: string
  value?: string
}

export type ImportEmissionFactorsResult = { success: true; count: number } | { success: false; errors: ImportError[] }

export type PreviewRow = {
  name: string
  source: string
  unit: string
  totalCo2: number
  postsAndSubPosts: string
}

export type PreviewEmissionFactorsResult =
  | { success: true; rows: PreviewRow[] }
  | { success: false; errors: ImportError[] }

export const COLUMNS = {
  name: 0,
  attribute: 1,
  location: 2,
  source: 3,
  unit: 4,
  customUnit: 5,
  totalCo2: 6,
  co2f: 7,
  ch4f: 8,
  ch4b: 9,
  n2o: 10,
  co2b: 11,
  sf6: 12,
  hfc: 13,
  pfc: 14,
  otherGES: 15,
  reliability: 16,
  technicalRepresentativeness: 17,
  geographicRepresentativeness: 18,
  temporalRepresentativeness: 19,
  completeness: 20,
  postsAndSubPosts: 21,
  base: 22,
  comment: 23,
} as const

export type ParsedRow = {
  name: string
  attribute: string | undefined
  location: string | undefined
  source: string
  unit: Unit
  customUnit: string | null
  totalCo2: number
  co2f: number | undefined
  ch4f: number | undefined
  ch4b: number | undefined
  n2o: number | undefined
  co2b: number | undefined
  sf6: number | undefined
  hfc: number | undefined
  pfc: number | undefined
  otherGES: number | undefined
  reliability: number
  technicalRepresentativeness: number
  geographicRepresentativeness: number
  temporalRepresentativeness: number
  completeness: number
  subPosts: Record<string, SubPost[]>
  comment: string | undefined
  isMonetary: boolean
  parts: []
  base: EmissionFactorBase | null
  rawPostsAndSubPosts: string
  rawUnit: string
}

export type ParseResult = { success: true; rows: ParsedRow[] } | { success: false; errors: ImportError[] }
