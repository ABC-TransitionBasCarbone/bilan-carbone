import { SurveyResponse } from '@repo/typeguards'

const STORAGE_PREFIX = 'mip_survey_'

export const surveyStorage = {
  /**
   * Save survey response to localStorage
   */
  saveResponse: (responseId: string, response: SurveyResponse): void => {
    try {
      const key = `${STORAGE_PREFIX}${responseId}`
      localStorage.setItem(key, JSON.stringify(response))
    } catch (error) {
      console.error('Failed to save survey response:', error)
    }
  },

  /**
   * Load survey response from localStorage
   */
  loadResponse: (responseId: string): SurveyResponse | null => {
    try {
      const key = `${STORAGE_PREFIX}${responseId}`
      const data = localStorage.getItem(key)
      if (!data) return null

      const response = JSON.parse(data)
      return {
        ...response,
        startedAt: new Date(response.startedAt),
        completedAt: response.completedAt ? new Date(response.completedAt) : undefined,
        updatedAt: new Date(response.updatedAt),
      }
    } catch (error) {
      console.error('Failed to load survey response:', error)
      return null
    }
  },

  /**
   * Delete survey response from localStorage
   */
  deleteResponse: (responseId: string): void => {
    try {
      const key = `${STORAGE_PREFIX}${responseId}`
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to delete survey response:', error)
    }
  },

  /**
   * Get all survey response IDs from localStorage
   */
  getAllResponseIds: (): string[] => {
    try {
      const keys = Object.keys(localStorage)
      return keys
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .map((key) => key.replace(STORAGE_PREFIX, ''))
    } catch (error) {
      console.error('Failed to get response IDs:', error)
      return []
    }
  },
}
