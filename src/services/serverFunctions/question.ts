'use server'

import { findEmissionFactorByImportedId } from '@/db/emissionFactors'
import { getAnswersByStudyAndSubPost, getQuestionsBySubPost, saveAnswer } from '@/db/question'
import { withServerResponse } from '@/utils/serverResponse'
import { Prisma, Question, SubPost } from '@prisma/client'
import { dbActualizedAuth } from '../auth'
import { createEmissionSource, updateEmissionSource } from './emissionSource'

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

    const { emissionFactorImportedId, depreciationPeriod } = getEmissionFactorByIdIntern(question.idIntern)

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
        depreciationPeriod,
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

const getEmissionFactorByIdIntern = (idIntern: string) =>
  emissionFactorMap[idIntern] ?? { emissionFactorImportedId: undefined, depreciationPeriod: undefined }

const emissionFactorMap: Record<string, { emissionFactorImportedId?: string; depreciationPeriod?: number }> = {
  // Bâtiment
  'quelle-est-la-surface-plancher-du-cinema': { emissionFactorImportedId: '15591' },
  'quand-le-batiment-a-t-il-ete-construit': { depreciationPeriod: 50 },

  // Energie
  'quelles-etaient-les-consommations-energetiques-du-cinema': { emissionFactorImportedId: '15591' },
  'quelle-est-votre-consommation-annuelle-de-diesel': { emissionFactorImportedId: '14015' },
}
