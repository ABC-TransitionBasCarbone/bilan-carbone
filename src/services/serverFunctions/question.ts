'use server'

import { getAnswersByStudyAndSubPost, getQuestionsByIdIntern, getQuestionsBySubPost, saveAnswer } from '@/db/question'
import { withServerResponse } from '@/utils/serverResponse'
import { Prisma, Question, SubPost } from '@prisma/client'
import { dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canReadStudy } from '../permissions/study'
import { createEmissionSource, updateEmissionSource } from './emissionSource'

export const saveAnswerForQuestion = async (
  question: Question,
  response: Prisma.InputJsonValue,
  studyId: string,
  studySiteId: string,
) =>
  withServerResponse('saveAnswerForQuestion', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const { emissionFactorImportedId, depreciationPeriod, linkQuestionId } =
      getEmissionFactorByIdIntern(question.idIntern, response) || {}

    let emissionFactorId = undefined
    let emissionSourceId = undefined

    if (!canReadStudy(session.user, studyId)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(studyId, session.user.organizationVersionId)
    const studySite = study?.sites.find((site) => site.id === studySiteId)
    if (!study || !studySite) {
      throw new Error(NOT_AUTHORIZED)
    }
    const value = depreciationPeriod ? undefined : Number(response)

    if (!emissionFactorImportedId && !depreciationPeriod && !linkQuestionId) {
      return saveAnswer(question.id, studySiteId, response)
    }

    if (linkQuestionId) {
      const linkQuestion = await getQuestionByIdIntern(linkQuestionId)
      if (!linkQuestion) {
        throw new Error(`Previous question not found for idIntern: ${linkQuestionId}`)
      }

      const linkAnswer = await getAnswerByQuestionId(linkQuestion.id, studySiteId)
      /**
       * TODO :
       * Sauvegarder dans une seule réponse json les différentes valeurs à multiplier
       * Créer une émissionSource uniquement quand les différentes valeurs sont connues
       */
      emissionSourceId = linkAnswer?.emissionSourceId ?? undefined
    }

    if (emissionFactorImportedId) {
      const emissionFactor = await findEmissionFactorByImportedId(emissionFactorImportedId)
      if (!emissionFactor) {
        throw new Error(`Emission factor not found for importedId: ${emissionFactorImportedId}`)
      }
      emissionFactorId = emissionFactor.id
    }

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
        await updateEmissionSource({ validated: true, emissionSourceId })
      }
    }

    return saveAnswer(question.id, studySiteId, response, emissionSourceId)
  })

export const getQuestionsWithAnswers = async (subPost: SubPost, studySiteId: string) =>
  withServerResponse('getQuestionsWithAnswers', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [questions, answers] = await Promise.all([
      getQuestionsBySubPost(subPost),
      getAnswersByStudyAndSubPost(studySiteId, subPost),
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
