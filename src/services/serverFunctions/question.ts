'use server'

import { deleteAnswer, getAnswersByStudyAndSubPost, getQuestionsBySubPost, saveAnswer } from '@/db/question'
import { withServerResponse } from '@/utils/serverResponse'
import { SubPost } from '@prisma/client'
import { dbActualizedAuth } from '../auth'

export const getQuestionsForSubPost = async (subPost: SubPost) =>
  withServerResponse('getQuestionsForSubPost', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    return getQuestionsBySubPost(subPost)
  })

export const getAnswersForStudyAndSubPost = async (studyId: string, subPost: SubPost) =>
  withServerResponse('getAnswersForStudyAndSubPost', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    return getAnswersByStudyAndSubPost(studyId, subPost)
  })

export const saveAnswerForQuestion = async (questionId: string, studyId: string, response: unknown) =>
  withServerResponse('saveAnswerForQuestion', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    return saveAnswer(questionId, studyId, response)
  })

export const deleteAnswerForQuestion = async (questionId: string, studyId: string) =>
  withServerResponse('deleteAnswerForQuestion', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    return deleteAnswer(questionId, studyId)
  })

export const getQuestionsWithAnswers = async (subPost: SubPost, studyId: string) =>
  withServerResponse('getQuestionsWithAnswers', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    const [questions, answers] = await Promise.all([
      getQuestionsBySubPost(subPost),
      getAnswersByStudyAndSubPost(studyId, subPost),
    ])

    return { questions, answers }
  })
