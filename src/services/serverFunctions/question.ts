'use server'

import { TableAnswer } from '@/components/dynamic-form/types/formTypes'
import { EmissionFactorInfo, emissionFactorMap } from '@/constants/emissionFactorMap'
import {
  LONG_DISTANCE_APPLIED_PERCENTAGE,
  LONG_DISTANCE_QUESTION_ID,
  SHORT_DISTANCE_QUESTION_ID,
} from '@/constants/questions'
import { getEmissionFactorByImportedIdAndStudiesEmissionSource } from '@/db/emissionFactors'
import {
  createAnswerEmissionSource,
  deleteAnswerEmissionSourceById,
  deleteAnswerEmissionSourcesForRow,
  findAllAnswerEmissionSourcesByAnswer,
  findAnswerEmissionSourceByAnswer,
  findAnswerEmissionSourceByAnswerAndEmissionSource,
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

const createAnswerEmissionSources = async (answerId: string, emissionSourceIds: string[]) => {
  for (const emissionSourceId of emissionSourceIds) {
    const existingEntry = await findAnswerEmissionSourceByAnswerAndEmissionSource(answerId, emissionSourceId)
    if (!existingEntry) {
      await createAnswerEmissionSource(answerId, emissionSourceId, null, null)
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
            validated: true,
          })

          if (newEmissionSource.success && newEmissionSource.data) {
            emissionSourceId = newEmissionSource.data.id
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
      return handleSpecialQuestions(question, response, study, studySiteId)
    }

    if (!emissionFactorImportedId && !depreciationPeriod && !linkDepreciationQuestionId) {
      return saveAnswer(question.id, studySiteId, response)
    }

    const existingAnswer = await getAnswerByQuestionId(question.id, studySiteId)
    if (existingAnswer) {
      const existingEmissionSource = await findAnswerEmissionSourceByAnswer(existingAnswer.id)
      emissionSourceId = existingEmissionSource?.emissionSourceId ?? undefined
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

    const isEmptyValue = isNaN(valueToStore) || valueToStore <= 0

    if (emissionSourceId) {
      if (isEmptyValue) {
        if (existingAnswer) {
          const existingEntry = await findAnswerEmissionSourceByAnswer(existingAnswer.id)
          if (existingEntry) {
            await deleteAnswerEmissionSourceById(existingEntry.id, emissionSourceId)
          }
        }
        emissionSourceId = undefined
      } else {
        await updateEmissionSource({
          value: valueToStore,
          emissionSourceId,
          emissionFactorId,
          depreciationPeriod: depreciationPeriodToStore,
        })
      }
    } else if (!isEmptyValue) {
      await createEmissionSource({
        studyId,
        studySiteId,
        value: valueToStore,
        name: question.idIntern,
        subPost: question.subPost,
        depreciationPeriod: depreciationPeriodToStore,
        emissionFactorId,
        validated: true,
      })
    }

    const savedAnswer = await saveAnswer(question.id, studySiteId, response)

    if (emissionSourceId && savedAnswer) {
      await createAnswerEmissionSources(savedAnswer.id, [emissionSourceId])

      // If this question has a linkDepreciationQuestionId, also ensure the linked answers are connected to the same emission source
      if (linkDepreciationQuestionId) {
        const linkQuestion = await getQuestionByIdIntern(linkDepreciationQuestionId)
        if (linkQuestion) {
          const linkAnswer = await getAnswerByQuestionId(linkQuestion.id, studySiteId)
          if (linkAnswer) {
            await createAnswerEmissionSources(linkAnswer.id, [emissionSourceId])
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

const cleanupEmissionSourcesByQuestionIdInterns = async (studySiteId: string, questionIdInterns: string[]) => {
  const answers = await Promise.all(
    questionIdInterns.map(async (idIntern) => {
      const question = await getQuestionByIdIntern(idIntern)
      if (!question) {
        return null
      }
      return getAnswerByQuestionId(question.id, studySiteId)
    }),
  )

  for (const answer of answers) {
    if (!answer) {
      continue
    }

    const existingAnswerEmissionSources = await findAllAnswerEmissionSourcesByAnswer(answer.id)

    for (const existingAnswerEmissionSource of existingAnswerEmissionSources) {
      await deleteAnswerEmissionSourceById(
        existingAnswerEmissionSource.id,
        existingAnswerEmissionSource.emissionSourceId,
      )
    }
  }
}

const applyCinemaProfileForTransport = async (
  question: Question,
  currentResponse: Prisma.InputJsonValue,
  study: FullStudy,
  studySiteId: string,
) => {
  const studyId = study.id

  await cleanupEmissionSourcesByQuestionIdInterns(studySiteId, [SHORT_DISTANCE_QUESTION_ID, LONG_DISTANCE_QUESTION_ID])

  let selectedShortDistanceProfile: string
  let selectedLongDistanceProfile: string

  if (question.idIntern === SHORT_DISTANCE_QUESTION_ID) {
    selectedShortDistanceProfile = currentResponse as string

    const longDistanceAnswer = await getAnswerByQuestionId(
      await getQuestionByIdIntern(LONG_DISTANCE_QUESTION_ID).then((q) => q?.id || ''),
      studySiteId,
    )
    selectedLongDistanceProfile = longDistanceAnswer?.response as string
  } else {
    selectedLongDistanceProfile = currentResponse as string

    const shortDistanceAnswer = await getAnswerByQuestionId(
      await getQuestionByIdIntern(SHORT_DISTANCE_QUESTION_ID).then((q) => q?.id || ''),
      studySiteId,
    )
    selectedShortDistanceProfile = shortDistanceAnswer?.response as string
  }

  const shortDistanceEmissionInfo = emissionFactorMap[SHORT_DISTANCE_QUESTION_ID]
  const longDistanceEmissionInfo = emissionFactorMap[LONG_DISTANCE_QUESTION_ID]

  const shortDistanceProfile = shortDistanceEmissionInfo?.shortDistanceProfiles?.[selectedShortDistanceProfile]
  const longDistanceProfile = longDistanceEmissionInfo?.longDistanceProfiles?.[selectedLongDistanceProfile]

  if (!shortDistanceProfile || !longDistanceProfile) {
    return []
  }

  const studySite = study.sites.find((site) => site.id === studySiteId)
  const numberOfTickets = studySite?.numberOfTickets || 0
  const distanceToParis = studySite?.distanceToParis || 0

  if (numberOfTickets === 0) {
    return []
  }

  const emissionSourceIds: string[] = []

  const shortDistancePercentageToUse = longDistanceProfile.shortDistancePercentage / 100

  for (const [transportMode, config] of Object.entries(shortDistanceProfile)) {
    if (config.percentage > 0 && config.averageDistance > 0) {
      const emissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        config.emissionFactorId,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )

      if (emissionFactor) {
        const value =
          (config.percentage / 100) * shortDistancePercentageToUse * config.averageDistance * numberOfTickets

        const newEmissionSource = await createEmissionSource({
          studyId,
          studySiteId,
          value,
          name: `cinema-profile-${transportMode}`,
          subPost: question.subPost,
          emissionFactorId: emissionFactor.id,
          validated: true,
        })

        if (newEmissionSource.success && newEmissionSource.data) {
          emissionSourceIds.push(newEmissionSource.data.id)
        }
      }
    }
  }

  if (longDistanceProfile.longDistancePercentage > 0 && distanceToParis > 0) {
    const longDistancePercentageToUse = longDistanceProfile.longDistancePercentage / 100

    const carEmissionFactorId = longDistanceEmissionInfo?.emissionFactors?.['Voiture longue distance']

    const carEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
      carEmissionFactorId!,
      study.emissionFactorVersions.map((v) => v.importVersionId),
    )

    if (carEmissionFactor) {
      const carValue =
        numberOfTickets * longDistancePercentageToUse * 0.7 * LONG_DISTANCE_APPLIED_PERCENTAGE * distanceToParis

      const newEmissionSource = await createEmissionSource({
        studyId,
        studySiteId,
        value: carValue,
        name: 'cinema-profile-long-voiture',
        subPost: question.subPost,
        emissionFactorId: carEmissionFactor.id,
        validated: true,
      })

      if (newEmissionSource.success && newEmissionSource.data) {
        emissionSourceIds.push(newEmissionSource.data.id)
      }
    }

    const tgvEmissionFactorId = longDistanceEmissionInfo?.emissionFactors?.['TGV']

    const tgvEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
      tgvEmissionFactorId!,
      study.emissionFactorVersions.map((v) => v.importVersionId),
    )

    if (tgvEmissionFactor) {
      const tgvValue =
        numberOfTickets * longDistancePercentageToUse * 0.3 * LONG_DISTANCE_APPLIED_PERCENTAGE * distanceToParis

      const newEmissionSource = await createEmissionSource({
        studyId,
        studySiteId,
        value: tgvValue,
        name: 'cinema-profile-long-tgv',
        subPost: question.subPost,
        emissionFactorId: tgvEmissionFactor.id,
        validated: true,
      })

      if (newEmissionSource.success && newEmissionSource.data) {
        emissionSourceIds.push(newEmissionSource.data.id)
      }
    }
  }

  return emissionSourceIds
}

const handleSpecialQuestions = async (
  question: Question,
  response: Prisma.InputJsonValue,
  study: FullStudy,
  studySiteId: string,
) => {
  let emissionSourceIds: string[] = []

  switch (question.idIntern) {
    case SHORT_DISTANCE_QUESTION_ID:
    case LONG_DISTANCE_QUESTION_ID: {
      emissionSourceIds = await applyCinemaProfileForTransport(question, response, study, studySiteId)
      break
    }
    default: {
      break
    }
  }

  const savedAnswer = await saveAnswer(question.id, studySiteId, response)

  if (savedAnswer && emissionSourceIds.length > 0) {
    await createAnswerEmissionSources(savedAnswer.id, emissionSourceIds)
  }

  return savedAnswer
}
