import { Question, Survey, SurveyResponse } from '@/types/survey'

export class SurveyEngine {
  private survey: Survey
  private response: SurveyResponse

  constructor(survey: Survey, response: SurveyResponse) {
    this.survey = survey
    this.response = response
  }

  /**
   * Get the current question
   */
  getCurrentQuestion(): Question | null {
    if (
      this.response.currentQuestionIndex < 0 ||
      this.response.currentQuestionIndex >= this.survey.questions.length
    ) {
      return null
    }
    return this.survey.questions[this.response.currentQuestionIndex]
  }

  /**
   * Check if there is a next question
   */
  hasNextQuestion(): boolean {
    return this.response.currentQuestionIndex < this.survey.questions.length - 1
  }

  /**
   * Check if there is a previous question
   */
  hasPreviousQuestion(): boolean {
    return this.response.currentQuestionIndex > 0
  }

  /**
   * Move to the next question
   */
  goToNextQuestion(): number {
    if (this.hasNextQuestion()) {
      this.response.currentQuestionIndex++
    }
    return this.response.currentQuestionIndex
  }

  /**
   * Move to the previous question
   */
  goToPreviousQuestion(): number {
    if (this.hasPreviousQuestion()) {
      this.response.currentQuestionIndex--
    }
    return this.response.currentQuestionIndex
  }

  /**
   * Validate an answer for a specific question
   */
  validateAnswer(question: Question, answer: string | string[]): string | null {
    if (question.required) {
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        return 'This question is required'
      }
      if (typeof answer === 'string' && answer.trim() === '') {
        return 'This question is required'
      }
    }

    if (question.type === 'text' && typeof answer === 'string') {
      const { validation } = question
      if (validation) {
        if (validation.minLength && answer.length < validation.minLength) {
          return `Answer must be at least ${validation.minLength} characters`
        }
        if (validation.maxLength && answer.length > validation.maxLength) {
          return `Answer must be at most ${validation.maxLength} characters`
        }
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern)
          if (!regex.test(answer)) {
            return 'Answer format is invalid'
          }
        }
      }
    }

    if (question.type === 'choice') {
      const validValues = question.options.map((opt) => opt.value)
      if (Array.isArray(answer)) {
        const invalidValues = answer.filter((val) => !validValues.includes(val))
        if (invalidValues.length > 0) {
          return 'Invalid choice selected'
        }
      } else if (typeof answer === 'string' && !validValues.includes(answer)) {
        return 'Invalid choice selected'
      }
    }

    return null
  }

  /**
   * Set an answer for the current question
   */
  setAnswer(answer: string | string[]): void {
    const currentQuestion = this.getCurrentQuestion()
    if (currentQuestion) {
      this.response.answers[currentQuestion.id] = answer
      this.response.updatedAt = new Date()
    }
  }

  /**
   * Get the answer for a specific question
   */
  getAnswer(questionId: string): string | string[] | undefined {
    return this.response.answers[questionId]
  }

  /**
   * Check if the survey is complete
   */
  isComplete(): boolean {
    return this.response.currentQuestionIndex >= this.survey.questions.length
  }

  /**
   * Mark the survey as completed
   */
  complete(): void {
    this.response.completed = true
    this.response.completedAt = new Date()
    this.response.updatedAt = new Date()
    this.response.currentQuestionIndex = this.survey.questions.length
  }

  /**
   * Get survey progress percentage
   */
  getProgress(): number {
    if (this.survey.questions.length === 0) return 0
    if (this.response.completed) return 100
    const answeredCount = Math.min(
      this.response.currentQuestionIndex + 1,
      this.survey.questions.length,
    )
    return Math.round((answeredCount / this.survey.questions.length) * 100)
  }

  /**
   * Get the response object
   */
  getResponse(): SurveyResponse {
    return this.response
  }

  /**
   * Get the survey object
   */
  getSurvey(): Survey {
    return this.survey
  }
}
