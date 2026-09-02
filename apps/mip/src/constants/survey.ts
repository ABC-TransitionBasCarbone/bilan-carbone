import { SURVEY_CATEGORY_KEYS } from '@abc-transitionbascarbone/publicodes/form/utils'

export { SURVEY_CATEGORY_KEYS }
export type SurveyCategoryKey = (typeof SURVEY_CATEGORY_KEYS)[number]

export const MIN_RESPONDENTS_FOR_CSV_EXPORT = 10

export const isCsvExportDisabled = (respondentsCount: number) => respondentsCount < MIN_RESPONDENTS_FOR_CSV_EXPORT
