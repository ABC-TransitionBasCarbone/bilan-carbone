'use server'

import { getAnswersByStudyAndSubPost, getQuestionsBySubPost, saveAnswer } from '@/db/question'
import { withServerResponse } from '@/utils/serverResponse'
import { Prisma, Question, SubPost } from '@prisma/client'
import { dbActualizedAuth } from '../auth'
import { createEmissionSource, updateEmissionSource } from './emissionSource'

export const saveAnswerForQuestion = async (
  question: Question,
  studyId: string,
  response: Prisma.InputJsonValue,
  studySiteId: string,
  emissionFactorId?: string,
  emissionSourceId?: string,
  depreciationPeriod?: number,
) =>
  withServerResponse('saveAnswerForQuestion', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    if (emissionSourceId) {
      await updateEmissionSource({
        value: Number(response),
        emissionSourceId,
        emissionFactorId,
      })
    } else {
      await createEmissionSource({
        name: String(response),
        studyId,
        studySiteId,
        value: Number(response),
        subPost: question.subPost,
        depreciationPeriod,
        emissionFactorId,
      })
    }

    return saveAnswer(question.id, studyId, response, emissionSourceId)
  })

export const getQuestionsWithAnswers = async (subPost: SubPost, studySiteId: string) =>
  withServerResponse('getQuestionsWithAnswers', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    const [questions, answers] = await Promise.all([
      getQuestionsBySubPost(subPost),
      getAnswersByStudyAndSubPost(studySiteId, subPost),
    ])

    return { questions, answers }
  })
