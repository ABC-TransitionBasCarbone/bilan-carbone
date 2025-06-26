'use server'

import { findEmissionFactorByImportedId } from '@/db/emissionFactors'
import {
  getAnswerByQuestionId,
  getAnswersByStudyAndSubPost,
  getQuestionById,
  getQuestionsBySubPost,
  saveAnswer,
} from '@/db/question'
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

    const { emissionFactorImportedId, depreciationPeriod, previousQuestionInternId } = getEmissionFactorByIdIntern(
      question.idIntern,
    )

    if (!emissionFactorImportedId || !depreciationPeriod) {
      return saveAnswer(question.id, studySiteId, response, emissionSourceId)
    }

    if (previousQuestionInternId) {
      const previousQuestion = await getQuestionById(previousQuestionInternId)
      if (!previousQuestion) {
        throw new Error(`Previous question not found for idIntern: ${previousQuestionInternId}`)
      }
      const previousAnswer = await getAnswerByQuestionId(previousQuestion.id)
      emissionSourceId = previousAnswer?.emissionSourceId ?? undefined
    }

    const emissionFactor = await findEmissionFactorByImportedId(emissionFactorImportedId)

    if (!emissionFactor) {
      throw new Error(`Emission factor not found for importedId: ${emissionFactorImportedId}`)
    }
    const emissionFactorId = emissionFactor.id
    const value = depreciationPeriod ? undefined : Number(response)

    if (emissionSourceId) {
      await updateEmissionSource({
        value,
        emissionSourceId,
        emissionFactorId,
        depreciationPeriod,
      })
    } else {
      const emissionSource = await createEmissionSource({
        studyId,
        studySiteId,
        value,
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

const emissionFactorMap: Record<
  string,
  { emissionFactorImportedId?: string; depreciationPeriod?: number; previousQuestionInternId?: string }
> = {
  // Fonctionnement	Bâtiment
  'quelle-est-la-surface-plancher-du-cinema': { emissionFactorImportedId: '15591' },
  'quand-le-batiment-a-t-il-ete-construit': {
    emissionFactorImportedId: '15591',
    depreciationPeriod: 50,
    previousQuestionInternId: 'quelle-est-la-surface-plancher-du-cinema',
  },
  'a-quand-remonte-la-derniere-renovation-importante': {
    emissionFactorImportedId: '15591',
    depreciationPeriod: 10,
    previousQuestionInternId: 'quelle-est-la-surface-plancher-du-cinema',
  },

  // Fonctionnement	Energie
  'quelles-etaient-les-consommations-energetiques-du-cinema': { emissionFactorImportedId: '15591' },
  'quelle-est-votre-consommation-annuelle-de-diesel': { emissionFactorImportedId: '14015' },
}
