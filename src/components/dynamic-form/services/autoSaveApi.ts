import { deleteAnswerForQuestion, saveAnswerForQuestion } from '@/services/serverFunctions/question'
import { Answer } from '@prisma/client'

export interface SaveAnswerRequest {
  questionId: string
  studyId: string
  response: unknown
}

export interface SaveAnswerResponse {
  success: boolean
  answer?: Answer
  error?: string
}

/**
 * API service for saving individual answers to the database using server actions
 */
export class AutoSaveApiService {
  /**
   * Save a single answer for a question
   */
  static async saveAnswer(request: SaveAnswerRequest): Promise<SaveAnswerResponse> {
    try {
      const result = await saveAnswerForQuestion(request.questionId, request.studyId, request.response)

      if (result.success) {
        console.log('📝 Auto-saved answer:', {
          questionId: request.questionId,
          response: request.response,
          timestamp: new Date().toISOString(),
        })

        return {
          success: true,
          answer: result.data,
        }
      } else {
        return {
          success: false,
          error: result.errorMessage || 'Failed to save answer',
        }
      }
    } catch (error) {
      console.error('❌ Auto-save failed:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save answer',
      }
    }
  }

  /**
   * Delete an answer for a question (when field is cleared)
   */
  static async deleteAnswer(questionId: string, studyId: string): Promise<SaveAnswerResponse> {
    try {
      const result = await deleteAnswerForQuestion(questionId, studyId)

      if (result.success) {
        console.log('🗑️ Auto-deleted answer:', {
          questionId,
          studyId,
          timestamp: new Date().toISOString(),
        })

        return {
          success: true,
        }
      } else {
        return {
          success: false,
          error: result.errorMessage || 'Failed to delete answer',
        }
      }
    } catch (error) {
      console.error('❌ Auto-delete failed:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete answer',
      }
    }
  }
}
