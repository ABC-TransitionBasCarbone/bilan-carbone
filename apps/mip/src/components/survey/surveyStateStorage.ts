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
