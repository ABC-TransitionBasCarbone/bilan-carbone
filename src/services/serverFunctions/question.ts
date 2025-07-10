'use server'

import { TableAnswer } from '@/components/dynamic-form/types/formTypes'
import { EmissionFactorInfo, emissionFactorMap } from '@/constants/emissionFactorMap'
import { getEmissionFactorByImportedIdAndStudiesEmissionSource } from '@/db/emissionFactors'
import {
  createAnswerEmissionSource,
  deleteAnswerEmissionSourceById,
  deleteAnswerEmissionSourcesForRow,
  findAnswerEmissionSourceByAnswer,
  findAnswerEmissionSourceByAnswerAndRow,
  findAnswerEmissionSourcesByAnswerAndRow,
  getAnswerByQuestionId,
  getAnswersByStudyAndSubPost,
  getQuestionById,
  getQuestionByIdIntern,
  getQuestionsByIdIntern,
  getQuestionsBySubPost,
  saveAnswer,
  upsertAnswerEmissionSource,
} from '@/db/question'
import { FullStudy, getStudyById } from '@/db/study'
import { withServerResponse } from '@/utils/serverResponse'
import {
  calculateTableEmissions,
  EmissionSourceCalculation,
  hasTableEmissionCalculator,
} from '@/utils/tableEmissionCalculations'
import { isTableAnswer } from '@/utils/tableInput'
import { Answer, Prisma, Question, QuestionType, SubPost } from '@prisma/client'
import { dbActualizedAuth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canReadStudy } from '../permissions/study'
import { createEmissionSource, updateEmissionSource } from './emissionSource'

const cleanupTableEmissionSources = async (tableAnswer: TableAnswer, existingAnswer: Answer) => {
  if (existingAnswer.response && isTableAnswer(existingAnswer.response)) {
    const existingTableAnswer = existingAnswer.response as TableAnswer
    const existingRowIds = existingTableAnswer.rows.map((row) => row.id)
    const currentRowIds = tableAnswer.rows.map((row) => row.id)
    const deletedRowIds = existingRowIds.filter((rowId) => !currentRowIds.includes(rowId))

    for (const deletedRowId of deletedRowIds) {
      await deleteAnswerEmissionSourcesForRow(existingAnswer.id, deletedRowId)
    }
  }
}

const cleanupRowEmissionSources = async (
  answerId: string,
  rowId: string,
  calculatedEmissionSources?: EmissionSourceCalculation[],
) => {
  if (!calculatedEmissionSources || calculatedEmissionSources.length === 0) {
    await deleteAnswerEmissionSourcesForRow(answerId, rowId)
  } else {
    const existingAnswerEmissionSources = await findAnswerEmissionSourcesByAnswerAndRow(answerId, rowId)
    const existingTypes = new Set(calculatedEmissionSources.map((e) => e.name))

    for (const existingEmissionSource of existingAnswerEmissionSources) {
      if (existingEmissionSource.emissionType && !existingTypes.has(existingEmissionSource.emissionType)) {
        await deleteAnswerEmissionSourceById(existingEmissionSource.id, existingEmissionSource.emissionSourceId)
      }
    }
  }
}

const handleTableEmissionSources = async (
  question: Question,
  tableAnswer: TableAnswer,
  studyId: string,
  studySiteId: string,
  study: FullStudy,
) => {
  const emissionSourceIds: string[] = []
  const existingAnswer = await getAnswerByQuestionId(question.id, studySiteId)

  if (existingAnswer) {
    await cleanupTableEmissionSources(tableAnswer, existingAnswer)
  }

  if (hasTableEmissionCalculator(question.idIntern)) {
    const calculationResults = await calculateTableEmissions(question, tableAnswer, study)

    for (let arrayIndex = 0; arrayIndex < tableAnswer.rows.length; arrayIndex++) {
      const row = tableAnswer.rows[arrayIndex]
      const result = calculationResults[arrayIndex]

      if (existingAnswer) {
        await cleanupRowEmissionSources(existingAnswer.id, row.id, result?.emissionSources)
      }

      for (const emissionSource of result.emissionSources) {
        let emissionSourceId: string

        let existingEmissionSource = null
        if (existingAnswer) {
          existingEmissionSource = await findAnswerEmissionSourceByAnswerAndRow(
            existingAnswer.id,
            row.id,
            emissionSource.name,
          )
        }

        if (existingEmissionSource) {
          await updateEmissionSource({
            emissionSourceId: existingEmissionSource.emissionSourceId,
            value: emissionSource.value,
            emissionFactorId: emissionSource.emissionFactorId,
            validated: true,
          })
          emissionSourceId = existingEmissionSource.emissionSourceId
        } else {
          const newEmissionSource = await createEmissionSource({
            studyId,
            studySiteId,
            value: emissionSource.value,
            name: `${question.idIntern}-${emissionSource.name}-${row.id}`,
            subPost: question.subPost,
            emissionFactorId: emissionSource.emissionFactorId,
          })

          if (newEmissionSource.success && newEmissionSource.data) {
            emissionSourceId = newEmissionSource.data.id
            await updateEmissionSource({ validated: true, emissionSourceId })
          } else {
            continue
          }
        }

        emissionSourceIds.push(emissionSourceId)
      }
    }
  }
  return emissionSourceIds
}

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

    if (!canReadStudy(session.user, studyId)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(studyId, session.user.organizationVersionId)
    const studySite = study?.sites.find((site) => site.id === studySiteId)
    if (!study || !studySite) {
      throw new Error(NOT_AUTHORIZED)
    }

    // Prevent saving to table column questions - data should be saved to the parent TABLE question
    if (await isTableColumnQuestion(question)) {
      throw new Error(
        `Cannot save directly to table column question ${question.idIntern}. Data should be saved to the parent TABLE question.`,
      )
    }

    if (question.type === QuestionType.TABLE) {
      let tableAnswer: TableAnswer

      if (isTableAnswer(response)) {
        tableAnswer = response
      } else {
        tableAnswer = { rows: [] }
      }

      const emissionSourceIds = await handleTableEmissionSources(question, tableAnswer, studyId, studySiteId, study)

      const savedAnswer = await saveAnswer(question.id, studySiteId, tableAnswer as unknown as Prisma.InputJsonValue)

      if (hasTableEmissionCalculator(question.idIntern) && savedAnswer) {
        const calculationResults = await calculateTableEmissions(question, tableAnswer, study)

        let emissionSourceIdIndex = 0

        for (let arrayIndex = 0; arrayIndex < tableAnswer.rows.length; arrayIndex++) {
          const row = tableAnswer.rows[arrayIndex]
          const result = calculationResults[arrayIndex]

          if (!result || result.emissionSources.length === 0) {
            continue
          }

          for (let emissionIndex = 0; emissionIndex < result.emissionSources.length; emissionIndex++) {
            const emissionSource = result.emissionSources[emissionIndex]
            const emissionSourceId = emissionSourceIds[emissionSourceIdIndex]

            emissionSourceIdIndex++

            if (emissionSourceId) {
              await upsertAnswerEmissionSource(savedAnswer.id, row.id, emissionSource.name, emissionSourceId)
            }
          }
        }
      }

      return savedAnswer
    }

    const { emissionFactorImportedId, depreciationPeriod, linkDepreciationQuestionId, isSpecial } =
      getEmissionFactorByIdIntern(question.idIntern, response) || {}

    let emissionFactorId = undefined
    let emissionSourceId = undefined

    let valueToStore = Number(response)
    const depreciationPeriodToStore = depreciationPeriod

    if (isSpecial) {
      return handleSpecialQuestions(question)
    }

    if (!emissionFactorImportedId && !depreciationPeriod && !linkDepreciationQuestionId) {
      return saveAnswer(question.id, studySiteId, response)
    }

    if (depreciationPeriod && !linkDepreciationQuestionId) {
      throw new Error(`question avec une période d'amortissement mais sans question liée ${question.idIntern}`)
    }

    if (linkDepreciationQuestionId) {
      const linkQuestion = await getQuestionByIdIntern(linkDepreciationQuestionId)
      if (!linkQuestion) {
        throw new Error(`Previous question not found for idIntern: ${linkDepreciationQuestionId}`)
      }

      const linkAnswer = await getAnswerByQuestionId(linkQuestion.id, studySiteId)
      if (linkAnswer) {
        const linkEmissionSource = await findAnswerEmissionSourceByAnswer(linkAnswer.id)
        emissionSourceId = linkEmissionSource?.emissionSourceId ?? undefined
      }

      const linkEmissionInfo = getEmissionFactorByIdIntern(linkQuestion.idIntern, linkAnswer?.response || {})

      const depreciationPeriodToStore =
        (depreciationPeriod ? depreciationPeriod : linkEmissionInfo?.depreciationPeriod) || 1
      const valueToDepreciate = depreciationPeriod ? parseFloat(linkAnswer?.response?.toString() || '0') : valueToStore
      const dateValue = depreciationPeriod ? valueToStore : parseFloat(linkAnswer?.response?.toString() || '0')

      if (depreciationPeriodToStore < new Date(study.startDate).getFullYear() - dateValue) {
        valueToStore = 0
      } else {
        valueToStore = valueToDepreciate
      }
    }

    if (emissionFactorImportedId) {
      const emissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        emissionFactorImportedId,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )
      if (!emissionFactor) {
        throw new Error(`Emission factor not found for importedId: ${emissionFactorImportedId}`)
      }
      emissionFactorId = emissionFactor.id
    }

    if (emissionSourceId) {
      await updateEmissionSource({
        value: valueToStore,
        emissionSourceId,
        emissionFactorId,
        depreciationPeriod: depreciationPeriodToStore,
      })
    } else {
      const emissionSource = await createEmissionSource({
        studyId,
        studySiteId,
        value: valueToStore,
        name: question.idIntern,
        subPost: question.subPost,
        depreciationPeriod: depreciationPeriodToStore,
        emissionFactorId,
      })

      if (emissionSource.success && emissionSource.data) {
        emissionSourceId = emissionSource.data.id
        await updateEmissionSource({ validated: true, emissionSourceId })
      }
    }

    const savedAnswer = await saveAnswer(question.id, studySiteId, response)

    if (emissionSourceId && savedAnswer) {
      const existingEntry = await findAnswerEmissionSourceByAnswer(savedAnswer.id)
      if (!existingEntry) {
        await createAnswerEmissionSource(savedAnswer.id, emissionSourceId, null, null)
      }

      // If this question has a linkDepreciationQuestionId, also ensure the linked answers are connected to the same emission source
      if (linkDepreciationQuestionId) {
        const linkQuestion = await getQuestionByIdIntern(linkDepreciationQuestionId)
        if (linkQuestion) {
          const linkAnswer = await getAnswerByQuestionId(linkQuestion.id, studySiteId)
          if (linkAnswer) {
            const linkExistingEntry = await findAnswerEmissionSourceByAnswer(linkAnswer.id)
            if (!linkExistingEntry) {
              await createAnswerEmissionSource(linkAnswer.id, emissionSourceId, null, null)
            }
          }
        }
      }
    }

    return savedAnswer
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

export const getAnswerByQuestionIdAndStudySiteId = async (questionId: string, studySiteId: string) =>
  withServerResponse('getAnswerByQuestionId', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    return getAnswerByQuestionId(questionId, studySiteId)
  })

export const getQuestionsFromIdIntern = async (idIntern: string) =>
  withServerResponse('getQuestionsByIdIntern', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    return getQuestionsByIdIntern(idIntern)
  })

export const getParentTableQuestion = async (columnQuestionId: string) =>
  withServerResponse('getParentTableQuestion', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error('Not authorized')
    }

    const columnQuestion = await getQuestionById(columnQuestionId)

    if (!columnQuestion) {
      throw new Error('Column question not found')
    }

    const relatedQuestions = await getQuestionsByIdIntern(columnQuestion.idIntern)

    const tableQuestion = relatedQuestions.find((q) => q.type === QuestionType.TABLE)

    if (!tableQuestion) {
      throw new Error('Parent TABLE question not found')
    }

    return tableQuestion
  })

const isTableColumnQuestion = async (question: Question): Promise<boolean> => {
  if (question.type === QuestionType.TABLE) {
    return false
  }

  try {
    const relatedQuestions = await getQuestionsByIdIntern(question.idIntern)

    const hasTableQuestion = relatedQuestions.some((q) => q.type === QuestionType.TABLE)

    return hasTableQuestion
  } catch {
    return false
  }
}

const getEmissionFactorByIdIntern = (idIntern: string, response: Prisma.InputJsonValue): EmissionFactorInfo => {
  const emissionFactorInfo = emissionFactorMap[idIntern]

  if (emissionFactorInfo && emissionFactorInfo.emissionFactors) {
    if (typeof response === 'object' && response !== null && !Array.isArray(response)) {
      for (const [, value] of Object.entries(response)) {
        if (typeof value === 'string' && emissionFactorInfo.emissionFactors[value]) {
          emissionFactorInfo.emissionFactorImportedId = emissionFactorInfo.emissionFactors[value]
          break
        }
      }
    } else {
      emissionFactorInfo.emissionFactorImportedId = emissionFactorInfo.emissionFactors[response.toString()]
    }
  }

  return emissionFactorInfo
}

const applyCinemaProfileForTransport = (question: Question) => {}

const handleSpecialQuestions = (question: Question) => {
  switch (question.idIntern) {
    case 'si-vous-souhaitez-vous-identifier-a-des-profils-de-cinema-comparable-de-quel-type-de-cinema-votre-etablissement-se-rapproche-le-plus': {
      return applyCinemaProfileForTransport(question)
    }
    default: {
      return
    }
  }
}
