export const getSurveyStorageKey = (surveyId: string) => `mip-publicodes-state-${surveyId}`

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

export const clearSurveyState = (surveyId: string) => {
  localStorage.removeItem(getSurveyStorageKey(surveyId))
}
