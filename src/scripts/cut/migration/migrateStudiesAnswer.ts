// Récupérer les réponses via la table "Answer" associés à un studySite / studyID.
// Mappping des réponses attendues avec les id de questions CUT, récupérable via la table Question

'use server'

import { prismaClient } from '@/db/client'
import { getCutEngine } from '@/environments/cut/publicodes/cut-engine'
import { studySiteToSituation } from '@/environments/cut/publicodes/studySiteToSituation'
import { CutRuleName, CutSituation } from '@/environments/cut/publicodes/types'
import { Answer, QuestionType, Unit } from '@prisma/client'
import {
  CutSituationKey,
  InternQuestionId,
  listQuestionsIds,
  questionsPublicodesMapping,
} from './questionsPublicodesMapping'

// Pour chaque answers:
// 1. Récupérer la question associée
// 2. Faire le mapping avec l'entrée dans la situation correspondante
// 3. Ajouter l'entrée dans la situation du record

type stuationWithListLayout = {
  mainSituation: CutSituation
  listLayoutSituations: Record<CutRuleName, CutSituation[]> | {}
}

const studySiteSituationMap: Record<string, stuationWithListLayout> = {}

const mappedQuestions = Object.values(questionsPublicodesMapping).flatMap((mapping) => Object.keys(mapping || {}))

function formatToPublicodesValue(
  value: string,
  type: QuestionType,
  unit: Unit | null,
  questionInternId: InternQuestionId,
): { situationKey: string; situationValue: number | string } | {} | null {
  if (!value) {
    return null
  }
  let situationState: Record<string, string | number> = {}
  let situationKey = null
  let situationValue = null

  switch (type) {
    case 'QCU':
      situationKey = questionsPublicodesMapping.QCU?.[questionInternId] as CutSituationKey
      if (value === '11-Oui') {
        situationValue = 'oui'
      }
      if (value === '12-Non') {
        situationValue = 'non'
      }
      break
    case 'NUMBER':
      situationKey = questionsPublicodesMapping.NUMBER?.[questionInternId] as CutSituationKey
      situationValue = parseFloat(value as string)
      break
    case 'TEXT':
      situationKey = questionsPublicodesMapping.TEXT?.[questionInternId] as CutSituationKey
      if (value === 'Invalid Date') {
        return null
      }
      situationValue = unit === 'YEAR' ? `'01/${value}'` : `'${value}'`
      break
    case 'SELECT':
      situationKey = questionsPublicodesMapping.SELECT?.[questionInternId]![0]
      situationValue = `'${
        questionsPublicodesMapping.SELECT?.[questionInternId]![1][
          value as keyof (typeof questionsPublicodesMapping.SELECT)[InternQuestionId]
        ]
      }'`
      break
    case 'QCM':
      // convert value string like "[option1, option2]" to array
      const selectedOptions = JSON.parse(value as string)
      for (const option of selectedOptions) {
        const key =
          questionsPublicodesMapping.QCM?.[questionInternId]?.[
            option as keyof (typeof questionsPublicodesMapping.QCM)[InternQuestionId]
          ]
        if (key) {
          situationState[key as string] = 'oui'
        }
      }
      break
    default:
      console.log(`Unsupported question type ${type} for question ID intern ${questionInternId}`)
      return null
  }
  if (Object.keys(situationState).length === 0) {
    if (!situationKey || !situationValue) {
      return null
    }
    situationState[situationKey] = situationValue
  }
  return situationState
}

async function processTableAnswer(answerCourante: Answer, questionCourante: { idIntern: string; type: QuestionType }) {
  const questionInternId = questionCourante.idIntern
  const value = answerCourante.response

  // @ts-ignore: Ignore dynamic key access
  const rows = value?.rows?.map((row) => row.data)
  for (const row of rows ?? []) {
    const selectQuestionInternId = questionInternId.replace('10-', '11-') as InternQuestionId
    const publicodesKey = // @ts-ignore: Ignore dynamic key access
      questionsPublicodesMapping.SELECT?.[selectQuestionInternId]?.[1][row[selectQuestionInternId]]?.replaceAll(
        ' ',
        '_',
      )

    if (!publicodesKey) {
      console.warn(
        `Skipping unmapped table row for question ID intern ${questionInternId} (question ID: ${answerCourante.id})`,
      )
      continue
    }

    for (const questionId of Object.keys(row ?? {})) {
      if (questionId.startsWith('11-')) {
        continue
      }

      await processAnswer(
        {
          id: answerCourante.id,
          questionId: questionId,
          studySiteId: answerCourante.studySiteId,
          response: row[questionId],
        } as Answer,
        `${questionId}-${publicodesKey}`,
      )
    }
  }

  return null
}

async function processAnswer(answerCourante: Answer, mappingInternId?: string) {
  // Si mappingInternId est fourni, c'est un traitement récursif et questionId est en fait un idIntern
  const questionCourante = mappingInternId
    ? await prismaClient.question.findUnique({
        where: { idIntern: answerCourante.questionId },
      })
    : await prismaClient.question.findUnique({
        where: { id: answerCourante.questionId },
      })

  if (!questionCourante) {
    throw new Error(`Question with ID ${answerCourante.questionId} not found for answer ID ${answerCourante.id}`)
  }

  if (listQuestionsIds.has(questionCourante.idIntern as InternQuestionId)) {
    // console.log(`Skipping list layout question ID intern ${questionCourante.idIntern} (question ID: ${answerCourante.id})`)
    return
  }

  if (mappingInternId && !mappedQuestions.includes(mappingInternId)) {
    console.warn(`Skipping unmapped table question ID ${mappingInternId} for answer ID ${answerCourante.id}`)
    return
  }

  if (!mappingInternId && !mappedQuestions.includes(questionCourante.idIntern)) {
    console.warn(`Skipping unmapped question ID ${questionCourante.idIntern} for answer ID ${answerCourante.id}`)
    return
  }

  // Initialiser la situation du studySite si pas encore fait
  if (!studySiteSituationMap[answerCourante.studySiteId]) {
    studySiteSituationMap[answerCourante.studySiteId] = { mainSituation: {}, listLayoutSituations: {} }
  }

  if (questionCourante.type === 'TABLE') {
    await processTableAnswer(answerCourante, questionCourante)
    return
  }

  const situationState = formatToPublicodesValue(
    answerCourante.response as string,
    questionCourante.type,
    questionCourante.unit,
    (mappingInternId ?? questionCourante.idIntern) as InternQuestionId,
  )

  if (!situationState || Object.keys(situationState).length === 0) {
    // console.log(
    //   `Skipping empty response for question ID intern ${questionCourante.idIntern} (question ID: ${answerCourante.id})`,
    // )
    return
  }

  studySiteSituationMap[answerCourante.studySiteId].mainSituation = {
    ...studySiteSituationMap[answerCourante.studySiteId].mainSituation,
    ...situationState,
  }
}

async function main() {
  const allAnswers = await prismaClient.answer.findMany({})

  await Promise.all(allAnswers.map((answer) => processAnswer(answer)))

  const studySiteInfo = await prismaClient.studySite.findMany({
    where: {
      id: { in: Object.keys(studySiteSituationMap) },
    },
  })

  for (const site of studySiteInfo) {
    const additionalSituation = studySiteToSituation(site)
    studySiteSituationMap[site.id].mainSituation = {
      ...studySiteSituationMap[site.id].mainSituation,
      ...additionalSituation,
    }
  }

  console.log('Mapped situation for study site:', studySiteSituationMap)

  // Check dans l'engine avant de save la situation
  const engine = getCutEngine()

  for (const [studySiteId, situation] of Object.entries(studySiteSituationMap)) {
    try {
      engine.setSituation(situation.mainSituation)
      engine.evaluate('bilan')
    } catch (e) {
      console.error(`Error evaluating situation for study site ID ${studySiteId}:`, e)
    }
  }

  // Sauvegader la situation
  //   await Promise.all(Object.entries(studySiteSituationMap).map(([studySiteId, situation]) =>
  //      upsertSituation(studySiteId, situation as InputJsonValue, PUBLICODES_COUNT_VERSION)
  // ))
}

main().then(() => console.log('done'))
