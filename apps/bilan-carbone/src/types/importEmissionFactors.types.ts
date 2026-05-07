import { EmissionFactorBase, SubPost, Unit } from '@abc-transitionbascarbone/db-common'

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
  unit: 2,
  customUnit: 3,
  source: 4,
  location: 5,
  technicalRepresentativeness: 6,
  geographicRepresentativeness: 7,
  temporalRepresentativeness: 8,
  completeness: 9,
  reliability: 10,
  comment: 11,
  totalCo2: 12,
  co2f: 13,
  ch4f: 14,
  ch4b: 15,
  n2o: 16,
  co2b: 17,
  sf6: 18,
  hfc: 19,
  pfc: 20,
  otherGES: 21,
  postsAndSubPosts: 22,
  base: 23,
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
