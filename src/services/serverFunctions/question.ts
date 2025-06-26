'use server'

import { getAnswersByStudyAndSubPost, getQuestionsBySubPost, saveAnswer } from '@/db/question'
import { withServerResponse } from '@/utils/serverResponse'
import { Prisma, Question, SubPost } from '@prisma/client'
import { dbActualizedAuth } from '../auth'
import { updateEmissionSource, createEmissionSource } from './emissionSource'
import { findEmissionFactorByImportedId, getEmissionFactorById, getEmissionFactorsByImportedIdsAndVersion } from '@/db/emissionFactors'

export const saveAnswerForQuestion = async (
  question: Question,
  response: Prisma.InputJsonValue,
  studyId: string,
  studySiteId: string,
  emissionSourceId?: string,
) =>
  withServerResponse('saveAnswerForQuestion', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }
    let emissionFactorImportedId = undefined
    let depreciationPeriod = undefined

    switch (question.idIntern) {
      case 'quelles-etaient-les-consommations-energetiques-du-cinema':
        emissionFactorImportedId = '15591'
        break
      case 'quelle-est-votre-consommation-annuelle-de-diesel':
        emissionFactorImportedId = '14015'
        break

    }

    if (!emissionFactorImportedId) {
      return saveAnswer(question.id, studySiteId, response, emissionSourceId)
    }

    const emissionFactor = await findEmissionFactorByImportedId(emissionFactorImportedId)
    if (!emissionFactor) {
      throw new Error(`Emission factor not found for importedId: ${emissionFactorImportedId}`)
    }
    const emissionFactorId = emissionFactor.id

    if (emissionSourceId) {
      await updateEmissionSource({
        value: Number(response),
        emissionSourceId,
        emissionFactorId,
        depreciationPeriod
      })
    } else {
      const emissionSource = await createEmissionSource({
        studyId,
        studySiteId,
        value: Number(response),
        name: question.idIntern,
        subPost: question.subPost,
        depreciationPeriod,
        emissionFactorId,
      })

      if (emissionSource.success && emissionSource.data) {
        emissionSourceId = emissionSource.data.id
      }
    }

    return saveAnswer(question.id, studySiteId, response, emissionSourceId)
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
