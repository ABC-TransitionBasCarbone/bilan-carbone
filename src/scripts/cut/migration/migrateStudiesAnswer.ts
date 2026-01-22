// Récupérer les réponses via la table "Answer" associés à un studySite / studyID.
// Mappping des réponses attendues avec les id de questions CUT, récupérable via la table Question

'use server'
import { prismaClient } from '@/db/client'
import { CutSituation } from '@/environments/cut/publicodes/types'
import { Answer, QuestionType } from '@prisma/client'
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
  questionInternId: InternQuestionId,
): [string, number | string] | null {
  if (!value) {
    return null
  }
  let situationValue = null
  let situationKey = null
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
      situationValue = `'${value}'`
      break
    case 'SELECT':
      situationKey = questionsPublicodesMapping.SELECT?.[questionInternId]![0]
      situationValue =
        questionsPublicodesMapping.SELECT?.[questionInternId]![1][
          value as keyof (typeof questionsPublicodesMapping.SELECT)[InternQuestionId]
        ]

    // case 'QCM':
    //   situationKey = questionsPublicodesMapping.QCM?.[questionInternId] as CutSituationKey)
    //   situationValue =
    //     questionsPublicodesMapping.QCM?.[questionInternId]?.[
    //       value as keyof (typeof questionsPublicodesMapping.QCM)[InternQuestionId]
    //     ] || null
    //   console.log('situationValue QCM', value, situationValue)
    //   break
    default:
      console.log(`Unsupported question type ${type} for question ID intern ${questionInternId}`)
      return null
  }
  if (situationKey === null || situationValue === null) {
    return null
  }
  return [situationKey, situationValue]
}

async function main() {
  const allAnswers = await prismaClient.answer.findMany({})

  await Promise.all(allAnswers.map((answer) => processAnswer(answer)))

  // log de la situation créée
  console.log('Mapped situation for study site:', studySiteSituationMap)

  // check dans l'engine avant de save la situation

  // Sauvegader la situation
  //   await Promise.all(Object.entries(studySiteSituationMap).map(([studySiteId, situation]) =>
  //      upsertSituation(studySiteId, situation as InputJsonValue, PUBLICODES_COUNT_VERSION)
  // ))
}

async function processAnswer(answerCourante: Answer) {
  const questionCourante = await prismaClient.question.findUnique({
    where: { id: answerCourante.questionId },
  })

  // console.log('answerCourante', answerCourante)
  // console.log('questionCourante', questionCourante)

  if (!questionCourante) {
    throw new Error(`Question with ID ${answerCourante.questionId} not found for answer ID ${answerCourante.id}`)
  }

  if (!mappedQuestions.includes(questionCourante.idIntern)) {
    console.log(`Skipping unmapped question ID ${questionCourante.idIntern} for answer ID ${answerCourante.id}`)
    return
  }

  // Initialiser la situation du studySite si pas encore fait
  if (!studySiteSituationMap[answerCourante.studySiteId]) {
    studySiteSituationMap[answerCourante.studySiteId] = {}
  }

  const situation = formatToPublicodesValue(
    answerCourante.response as string,
    questionCourante.type,
    questionCourante.idIntern as InternQuestionId,
  )

  if (!situation) {
    console.log(
      `Skipping empty response for question ID intern ${questionCourante.idIntern} (question ID: ${answerCourante.id})`,
    )
    return
  }
  const [situationKey, situationValue] = situation

  studySiteSituationMap[answerCourante.studySiteId][situationKey as CutSituationKey] = situationValue

  // switch (questionCourante.idIntern) {
  //   case 'quelle-est-la-surface-plancher-du-cinema': {
  //     console.log('Processing surface de plancher', situationValue)
  //     studySiteSituationMap[answerCourante.studySiteId]['fonctionnement . bâtiment . construction . surface'] =
  //       situationValue
  //     break
  //   }
  //   case 'le-batiment-est-il-partage-avec-une-autre-activite': {
  //     studySiteSituationMap[answerCourante.studySiteId]['fonctionnement . bâtiment . est partagé'] = situationValue
  //     break
  //   }
  //   case 'gaz': {
  //     studySiteSituationMap[answerCourante.studySiteId]['fonctionnement . énergie . gaz . consommation'] =
  //       situationValue
  //     break
  //   }
  //   default:
  //     console.log(
  //       `No mapping defined for question ID intern ${questionCourante.idIntern} (question ID: ${questionCourante.id})`,
  //     )
  // }
}

main().then(() => console.log('done'))
