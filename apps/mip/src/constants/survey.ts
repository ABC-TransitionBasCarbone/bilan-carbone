export const SURVEY_CATEGORY_KEYS = [
  'DT',
  'transport',
  'alimentation',
  'divers',
  'logement',
  'numerique',
  'bureaux',
] as const

export type SurveyCategoryKey = (typeof SURVEY_CATEGORY_KEYS)[number]

export const MIN_RESPONDENTS_FOR_CSV_EXPORT = 10

export const isCsvExportDisabled = (respondentsCount: number) => respondentsCount < MIN_RESPONDENTS_FOR_CSV_EXPORT
