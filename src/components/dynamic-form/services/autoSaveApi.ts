import { Answer } from '../types/questionTypes'

export interface SaveAnswerRequest {
  questionId: string
  studyId: string
  response: string | string[]
}

export interface SaveAnswerResponse {
  success: boolean
  answer?: Answer
  error?: string
}

/**
 * Mock API service for saving individual answers
 * In real implementation, this would make HTTP calls to your backend
 */
export class AutoSaveApiService {
  private static readonly MOCK_DELAY = 500 // Simulate network delay

  /**
   * Save a single answer for a question
   */
  static async saveAnswer(request: SaveAnswerRequest): Promise<SaveAnswerResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, this.MOCK_DELAY))

    // Simulate random failures (5% chance)
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: 'Network error: Failed to save answer',
      }
    }

    // Mock successful save
    const mockAnswer: Answer = {
      id: `answer-${Date.now()}`,
      questionId: request.questionId,
      studyId: request.studyId,
      responses: Array.isArray(request.response) ? request.response : [request.response],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log('📝 Auto-saved answer:', {
      questionId: request.questionId,
      response: request.response,
      timestamp: new Date().toISOString(),
    })

    return {
      success: true,
      answer: mockAnswer,
    }
  }

  /**
   * Delete an answer for a question (when field is cleared)
   */
  static async deleteAnswer(questionId: string, studyId: string): Promise<SaveAnswerResponse> {
    await new Promise((resolve) => setTimeout(resolve, this.MOCK_DELAY))

    console.log('🗑️ Auto-deleted answer:', {
      questionId,
      studyId,
      timestamp: new Date().toISOString(),
    })

    return {
      success: true,
    }
  }
}
