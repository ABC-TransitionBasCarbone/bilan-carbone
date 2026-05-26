import { ImportError } from '@/types/import.types'
import { EmissionFactorBase, SubPost, Unit } from '@abc-transitionbascarbone/db-common'

export type { ImportError }

export type ImportEmissionFactorsResult = { success: true; count: number } | { success: false; errors: ImportError[] }

export type PreviewRow = {
  name: string
  source: string
  unit: string
  customUnit: string | null
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
  isMonetary: 4,
  source: 5,
  location: 6,
  technicalRepresentativeness: 7,
  geographicRepresentativeness: 8,
  temporalRepresentativeness: 9,
  completeness: 10,
  reliability: 11,
  comment: 12,
  totalCo2: 13,
  co2f: 14,
  ch4f: 15,
  ch4b: 16,
  n2o: 17,
  co2b: 18,
  sf6: 19,
  hfc: 20,
  pfc: 21,
  otherGES: 22,
  postsAndSubPosts: 23,
  base: 24,
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
