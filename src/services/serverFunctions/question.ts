'use server'

import { getAnswersByStudyAndSubPost, getQuestionsBySubPost, saveAnswer } from '@/db/question'
import { withServerResponse } from '@/utils/serverResponse'
import { Prisma, SubPost } from '@prisma/client'
import { dbActualizedAuth } from '../auth'
import { createEmissionSource } from './emissionSource'

export const saveAnswerForQuestion = async (
  questionId: string,
  studyId: string,
  response: Prisma.InputJsonValue,
  studySiteId: string,
) =>
  withServerResponse('saveAnswerForQuestion', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    console.log('Saving answer for question:', questionId, 'in study:', studyId, 'with response:', response)

    /*
    TODO : calculate value to save in study_emission_sources (StudyEmissionSource)
    if numeric response, it's ok
    if text or boolean response, we need to calculate the value based on the response
    */
    createEmissionSource({
      name: String(response),
      studyId,
      studySiteId, // This should be set based on your logic
      value: Number(response),
      depreciationPeriod: 0, // This should be set based on your logic
      emissionFactorId: '', // This should be set based on your logic
      subPost: SubPost.Batiments, // Assuming this is the correct subPost for questions
    })

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
