import { FormState } from '@publicodes/forms'

export const getSurveyStorageKey = (surveyId: string) => `mip-publicodes-state-${surveyId}`
export const getSurveySubmittedStorageKey = (surveyId: string) => `mip-publicodes-submitted-${surveyId}`

export const saveSurveyState = (surveyId: string, state: unknown) => {
  localStorage.setItem(getSurveyStorageKey(surveyId), JSON.stringify(state))
}

export const loadSurveyState = <T>(surveyId: string): T | null => {
  try {
    const raw = localStorage.getItem(getSurveyStorageKey(surveyId))
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export const isRestorableSurveyState = (value: unknown, rules: Record<string, unknown>): value is FormState<string> => {
  if (!value || typeof value !== 'object' || !('pages' in value) || !Array.isArray(value.pages)) {
    return false
  }

  const state = value as FormState<string>
  const hasKnownPages = (pages: FormState<string>['pages']) =>
    pages.every(
      (page) =>
        Array.isArray(page?.elements) && page.elements.every((rule) => typeof rule === 'string' && rule in rules),
    )

  return (
    Number.isInteger(state.currentPageIndex) &&
    state.currentPageIndex >= 0 &&
    state.currentPageIndex < state.pages.length &&
    Array.isArray(state.nextPages) &&
    hasKnownPages(state.pages) &&
    hasKnownPages(state.nextPages) &&
    Array.isArray(state.targets) &&
    state.targets.every((rule) => typeof rule === 'string' && rule in rules) &&
    !!state.situation &&
    typeof state.situation === 'object'
  )
}

export const saveSurveySubmissionStatus = (surveyId: string, isSubmitted: boolean) => {
  localStorage.setItem(getSurveySubmittedStorageKey(surveyId), JSON.stringify(isSubmitted))
}

export const loadSurveySubmissionStatus = (surveyId: string): boolean => {
  try {
    const raw = localStorage.getItem(getSurveySubmittedStorageKey(surveyId))
    return raw ? (JSON.parse(raw) as boolean) : false
  } catch {
    return false
  }
}

export const clearSurveyState = (surveyId: string) => {
  localStorage.removeItem(getSurveyStorageKey(surveyId))
  localStorage.removeItem(getSurveySubmittedStorageKey(surveyId))
}
