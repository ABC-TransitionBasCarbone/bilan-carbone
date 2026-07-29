import { EntityFilter } from '@/types/results.types'
import { SURVEY_CATEGORY_KEYS } from '@abc-transitionbascarbone/publicodes/form/utils'

export { SURVEY_CATEGORY_KEYS }
export type SurveyCategoryKey = (typeof SURVEY_CATEGORY_KEYS)[number]

export const DEFAULT_ENTITY_FILTERS: EntityFilter[] = [
  { id: 'all', name: 'Tous' },
  { id: 'rh', name: 'Ressources humaines' },
  { id: 'it', name: 'Informatique' },
  { id: 'commercial', name: 'Commercial' },
  { id: 'direction', name: 'Direction' },
]

export const ENTITY_CATEGORY_FACTORS: Record<string, Partial<Record<SurveyCategoryKey, number>>> = {
  rh: { DT: 1.1, transport: 0.6, alimentation: 0.9, divers: 0.7, logement: 1.2 },
  it: { DT: 0.8, transport: 0.9, alimentation: 1.0, divers: 1.8, logement: 1.1 },
  commercial: { DT: 1.2, transport: 2.1, alimentation: 1.0, divers: 0.9, logement: 0.8 },
  direction: { DT: 0.7, transport: 1.4, alimentation: 1.1, divers: 1.0, logement: 1.3 },
}

export const MIN_RESPONDENTS_FOR_CSV_EXPORT = 10

export const isCsvExportDisabled = (respondentsCount: number) => respondentsCount < MIN_RESPONDENTS_FOR_CSV_EXPORT
