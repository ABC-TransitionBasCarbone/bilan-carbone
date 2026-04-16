/**
 * Survey Store - Zustand state management for surveys
 */

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  SurveyEngine,
  surveyStorage,
  Survey,
  SurveyResponse,
  SurveyState,
} from '@repo/survey'

interface SurveyActions {
  loadSurvey: (survey: Survey, responseId?: string) => void
  setAnswer: (questionId: string, answer: string | string[]) => void
  goToNext: () => void
  goToPrevious: () => void
  goToQuestion: (index: number) => void
  completeSurvey: () => void
  resetSurvey: () => void
  saveToLocalStorage: () => void
  loadFromLocalStorage: (responseId: string) => boolean
}

type SurveyStore = SurveyState & SurveyActions

export const useSurveyStore = create<SurveyStore>((set, get) => ({
  // Initial state
  survey: null,
  response: null,
  currentQuestionIndex: 0,
  isLoading: false,
  error: null,

  // Load a survey and initialize or restore response
  loadSurvey: (survey: Survey, responseId?: string) => {
    set({ isLoading: true, error: null })

    try {
      let response: SurveyResponse

      // Try to load existing response
      if (responseId) {
        const existingResponse = surveyStorage.loadResponse(responseId)
        if (existingResponse && existingResponse.surveyId === survey.id) {
          response = existingResponse
        } else {
          // Create new response with provided ID
          response = createNewResponse(survey.id, responseId)
        }
      } else {
        // Create new response with generated ID
        response = createNewResponse(survey.id, uuidv4())
      }

      set({
        survey,
        response,
        currentQuestionIndex: response.currentQuestionIndex,
        isLoading: false,
      })

      // Auto-save to localStorage
      get().saveToLocalStorage()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load survey',
        isLoading: false,
      })
    }
  },

  // Set answer for a question
  setAnswer: (questionId: string, answer: string | string[]) => {
    const { survey, response } = get()
    if (!survey || !response) return

    const engine = new SurveyEngine(survey, response)
    engine.setAnswer(answer)

    set({
      response: engine.getResponse(),
    })

    // Auto-save to localStorage
    get().saveToLocalStorage()
  },

  // Navigate to next question
  goToNext: () => {
    const { survey, response } = get()
    if (!survey || !response) return

    const engine = new SurveyEngine(survey, response)
    const currentQuestion = engine.getCurrentQuestion()

    // Validate current answer before proceeding
    if (currentQuestion && currentQuestion.required) {
      const answer = engine.getAnswer(currentQuestion.id)
      const validationError = engine.validateAnswer(
        currentQuestion,
        answer || '',
      )
      if (validationError) {
        set({ error: validationError })
        return
      }
    }

    if (engine.hasNextQuestion()) {
      const newIndex = engine.goToNextQuestion()
      set({
        response: engine.getResponse(),
        currentQuestionIndex: newIndex,
        error: null,
      })
      get().saveToLocalStorage()
    } else if (!engine.isComplete()) {
      // Last question reached, mark as complete
      engine.complete()
      set({
        response: engine.getResponse(),
        currentQuestionIndex: survey.questions.length,
      })
      get().saveToLocalStorage()
    }
  },

  // Navigate to previous question
  goToPrevious: () => {
    const { survey, response } = get()
    if (!survey || !response) return

    const engine = new SurveyEngine(survey, response)
    if (engine.hasPreviousQuestion()) {
      const newIndex = engine.goToPreviousQuestion()
      set({
        response: engine.getResponse(),
        currentQuestionIndex: newIndex,
        error: null,
      })
      get().saveToLocalStorage()
    }
  },

  // Navigate to a specific question
  goToQuestion: (index: number) => {
    const { survey, response } = get()
    if (!survey || !response) return

    if (index >= 0 && index <= survey.questions.length) {
      set({
        currentQuestionIndex: index,
        response: {
          ...response,
          currentQuestionIndex: index,
        },
        error: null,
      })
      get().saveToLocalStorage()
    }
  },

  // Complete the survey
  completeSurvey: () => {
    const { survey, response } = get()
    if (!survey || !response) return

    const engine = new SurveyEngine(survey, response)
    engine.complete()

    set({
      response: engine.getResponse(),
      currentQuestionIndex: survey.questions.length,
    })

    get().saveToLocalStorage()
  },

  // Reset the survey
  resetSurvey: () => {
    set({
      survey: null,
      response: null,
      currentQuestionIndex: 0,
      isLoading: false,
      error: null,
    })
  },

  // Save to localStorage
  saveToLocalStorage: () => {
    const { response } = get()
    if (response) {
      surveyStorage.saveResponse(response.responseId, response)
    }
  },

  // Load from localStorage
  loadFromLocalStorage: (responseId: string): boolean => {
    const response = surveyStorage.loadResponse(responseId)
    if (response) {
      set({
        response,
        currentQuestionIndex: response.currentQuestionIndex,
      })
      return true
    }
    return false
  },
}))

// Helper function to create a new response
function createNewResponse(
  surveyId: string,
  responseId: string,
): SurveyResponse {
  const now = new Date()
  return {
    surveyId,
    responseId,
    answers: {},
    currentQuestionIndex: 0,
    completed: false,
    startedAt: now,
    updatedAt: now,
  }
}
