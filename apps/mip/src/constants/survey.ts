import { EntityFilter } from '@/types/results.types'

export const CATEGORY_MAP = [
  { key: 'commute', rule: 'DT' },
  { key: 'travel', rule: 'transport' },
  { key: 'food', rule: 'alimentation' },
  { key: 'digital', rule: 'divers' },
  { key: 'office', rule: 'logement' },
] as const

export type SurveyCategoryKey = (typeof CATEGORY_MAP)[number]['key']

export const DEFAULT_ENTITY_FILTERS: EntityFilter[] = [
  { id: 'all', name: 'Tous' },
  { id: 'rh', name: 'Ressources humaines' },
  { id: 'it', name: 'Informatique' },
  { id: 'commercial', name: 'Commercial' },
  { id: 'direction', name: 'Direction' },
]

export const ENTITY_CATEGORY_FACTORS: Record<string, Partial<Record<SurveyCategoryKey, number>>> = {
  rh: { commute: 1.1, travel: 0.6, food: 0.9, digital: 0.7, office: 1.2 },
  it: { commute: 0.8, travel: 0.9, food: 1.0, digital: 1.8, office: 1.1 },
  commercial: { commute: 1.2, travel: 2.1, food: 1.0, digital: 0.9, office: 0.8 },
  direction: { commute: 0.7, travel: 1.4, food: 1.1, digital: 1.0, office: 1.3 },
}
