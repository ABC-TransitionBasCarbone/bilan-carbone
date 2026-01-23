// Récupérer les réponses via la table "Answer" associés à un studySite / studyID.
// Mappping des réponses attendues avec les id de questions CUT, récupérable via la table Question

'use server'

import { prismaClient } from '@/db/client'
import { getCutEngine } from '@/environments/cut/publicodes/cut-engine'
import { studySiteToSituation } from '@/environments/cut/publicodes/studySiteToSituation'
import { CutSituation } from '@/environments/cut/publicodes/types'
import { Answer, QuestionType, Unit } from '@prisma/client'
import { CutSituationKey, InternQuestionId, questionsPublicodesMapping } from './questionsPublicodesMapping'
// Find all study sites that have CNC data but missing fields

// Pour chaque answers:
// 1. Récupérer la question associée
// 2. Faire le mapping avec l'entrée dans la situation correspondante
// 3. Ajouter l'entrée dans la situation du record

const studySiteSituationMap: Record<string, CutSituation> = {}

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
      situationValue = parseFloat(value)
      break
    case 'TEXT':
      situationKey = questionsPublicodesMapping.TEXT?.[questionInternId] as CutSituationKey
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
      const selectedOptions = JSON.parse(value)
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

async function processAnswer(answerCourante: Answer) {
  const questionCourante = await prismaClient.question.findUnique({
    where: { id: answerCourante.questionId },
  })

  if (!questionCourante) {
    throw new Error(`Question with ID ${answerCourante.questionId} not found for answer ID ${answerCourante.id}`)
  }

  if (!mappedQuestions.includes(questionCourante.idIntern)) {
    console.warn(`Skipping unmapped question ID ${questionCourante.idIntern} for answer ID ${answerCourante.id}`)
    return
  }

  // Initialiser la situation du studySite si pas encore fait
  if (!studySiteSituationMap[answerCourante.studySiteId]) {
    studySiteSituationMap[answerCourante.studySiteId] = {}
  }

  const situationState = formatToPublicodesValue(
    answerCourante.response as string,
    questionCourante.type,
    questionCourante.unit,
    questionCourante.idIntern as InternQuestionId,
  )

  if (!situationState || Object.keys(situationState).length === 0) {
    console.log(
      `Skipping empty response for question ID intern ${questionCourante.idIntern} (question ID: ${answerCourante.id})`,
    )
    return
  }

  studySiteSituationMap[answerCourante.studySiteId] = {
    ...studySiteSituationMap[answerCourante.studySiteId],
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
    studySiteSituationMap[site.id] = {
      ...studySiteSituationMap[site.id],
      ...additionalSituation,
    }
  }

  console.log('Mapped situation for study site:', studySiteSituationMap)

  // check dans l'engine avant de save la situation

  const engine = getCutEngine()

  for (const [studySiteId, situation] of Object.entries(studySiteSituationMap)) {
    try {
      engine.setSituation(situation)
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
