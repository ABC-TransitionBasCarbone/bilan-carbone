'use server'

import { getAnswersByStudyAndSubPost, getQuestionsByIdIntern, getQuestionsBySubPost, saveAnswer } from '@/db/question'
import { withServerResponse } from '@/utils/serverResponse'
import { Prisma, SubPost } from '@prisma/client'
import { dbActualizedAuth } from '../auth'

export const saveAnswerForQuestion = async (questionId: string, studyId: string, response: Prisma.InputJsonValue) =>
  withServerResponse('saveAnswerForQuestion', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    return saveAnswer(questionId, studyId, response)
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

export const getQuestionsFromIdIntern = async (idIntern: string) =>
  withServerResponse('getQuestionsByIdIntern', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    return getQuestionsByIdIntern(idIntern)
  })
