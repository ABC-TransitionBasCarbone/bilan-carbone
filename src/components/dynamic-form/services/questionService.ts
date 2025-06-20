import { SubPost } from '@prisma/client'
import { Answer, Question } from '../types/questionTypes'
import { mockAnswers, mockQuestions } from './mockData'

export interface QuestionServiceOptions {
  subPost?: SubPost
  studyId?: string
}

export class QuestionService {
  static async getQuestionsBySubPost(subPost: SubPost): Promise<Question[]> {
    // Mock implementation - in real app, this would query the database
    await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate network delay

    return mockQuestions.filter((q) => q.subPost === subPost)
  }

  static async getAnswersByStudy(studyId: string, questionIds?: string[]): Promise<Answer[]> {
    // Mock implementation - in real app, this would query the database
    await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate network delay

    let answers = mockAnswers.filter((a) => a.studyId === studyId)

    if (questionIds) {
      answers = answers.filter((a) => questionIds.includes(a.questionId))
    }

    return answers
  }

  static async getAnswersForQuestions(studyId: string, questions: Question[]): Promise<Answer[]> {
    const questionIds = questions.map((q) => q.id)
    return this.getAnswersByStudy(studyId, questionIds)
  }

  static async saveAnswers(answers: Answer[]): Promise<{ success: boolean; errors?: string[] }> {
    // Mock implementation - in real app, this would save to database
    await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate network delay

    // Simulate some validation
    const errors: string[] = []

    for (const answer of answers) {
      if (!answer.questionId || !answer.studyId) {
        errors.push(`Invalid answer: missing questionId or studyId`)
      }

      if (answer.responses.length === 0) {
        errors.push(`Answer for question ${answer.questionId} has no responses`)
      }
    }

    if (errors.length > 0) {
      return { success: false, errors }
    }

    // Mock successful save
    console.log('Mock: Saved answers to database:', answers)
    return { success: true }
  }

  static async deleteAnswer(answerId: string): Promise<{ success: boolean; error?: string }> {
    // Mock implementation - in real app, this would delete from database
    await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate network delay

    console.log('Mock: Deleted answer from database:', answerId)
    return { success: true }
  }

  static async getQuestionById(questionId: string): Promise<Question | null> {
    // Mock implementation - in real app, this would query the database
    await new Promise((resolve) => setTimeout(resolve, 50)) // Simulate network delay

    return mockQuestions.find((q) => q.id === questionId) || null
  }

  // Utility method to get questions and answers together
  static async getQuestionsWithAnswers(
    subPost: SubPost,
    studyId: string,
  ): Promise<{ questions: Question[]; answers: Answer[] }> {
    const [questions, answers] = await Promise.all([
      this.getQuestionsBySubPost(subPost),
      this.getAnswersByStudy(studyId),
    ])

    return { questions, answers }
  }
}
