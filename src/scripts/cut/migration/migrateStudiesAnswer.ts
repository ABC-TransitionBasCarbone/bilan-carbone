// Récupérer les réponses via la table "Answer" associés à un studySite / studyID.
// Mappping des réponses attendues avec les id de questions CUT, récupérable via la table Question

'use server'

import { prismaClient } from '@/db/client'
import { getCutEngine } from '@/environments/cut/publicodes/cut-engine'
import { studySiteToSituation } from '@/environments/cut/publicodes/studySiteToSituation'
import { CutRuleName, CutSituation } from '@/environments/cut/publicodes/types'
import { Answer, QuestionType, Unit } from '@prisma/client'
import { CutSituationKey, InternQuestionId, questionsPublicodesMapping } from './questionsPublicodesMapping'

// Pour chaque answers:
// 1. Récupérer la question associée
// 2. Faire le mapping avec l'entrée dans la situation correspondante
// 3. Ajouter l'entrée dans la situation du record

type stuationWithListLayout = {
  mainSituation: CutSituation
  listLayoutSituations: Record<CutRuleName, CutSituation[]>
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
      const unformattedSituationValue =
        questionsPublicodesMapping.SELECT?.[questionInternId]![1][
          value as keyof (typeof questionsPublicodesMapping.SELECT)[InternQuestionId]
        ]
      situationValue = unformattedSituationValue ? `'${unformattedSituationValue}'` : null
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

      await processAnswer({
        answerCourante: {
          id: answerCourante.id,
          studySiteId: answerCourante.studySiteId,
          response: row[questionId],
        } as Answer,
        questionInternId: questionId as InternQuestionId,
        mappingInternId: `${questionId}-${publicodesKey}`,
      })
    }
  }

  return null
}

async function processListAnswer(answerCourante: Answer, listRule: string) {
  const value = answerCourante.response

  // @ts-ignore: Ignore dynamic key access
  for (const row of value?.rows ?? []) {
    for (const questionId of Object.keys(row.data ?? {})) {
      await processAnswer({
        answerCourante: {
          id: answerCourante.id,
          studySiteId: answerCourante.studySiteId,
          response: row.data[questionId],
        } as Answer,
        questionInternId: questionId as InternQuestionId,
        isListItemFrom: `${listRule} | ${row.id}`,
      })
    }
  }

  return null
}

async function processAnswer({
  answerCourante,
  questionInternId,
  mappingInternId,
  isListItemFrom,
}: {
  answerCourante: Answer
  questionInternId?: InternQuestionId
  mappingInternId?: string
  isListItemFrom?: string
}) {
  // Si mappingInternId est fourni, c'est un traitement récursif et questionId est en fait un idIntern
  const questionCourante = questionInternId
    ? await prismaClient.question.findUnique({
        where: { idIntern: questionInternId },
      })
    : await prismaClient.question.findUnique({
        where: { id: answerCourante.questionId },
      })

  if (!questionCourante) {
    throw new Error(`Question not found for answer ID ${answerCourante.id}`)
  }

  if (mappingInternId && !mappedQuestions.includes(mappingInternId)) {
    console.warn(`Skipping unmapped table question ID ${mappingInternId} for answer ID ${answerCourante.id}`)
    return
  }
  if (!mappingInternId && !mappedQuestions.includes(questionCourante.idIntern ?? questionInternId)) {
    console.warn(`Skipping unmapped question ID ${questionCourante.idIntern} for answer ID ${answerCourante.id}`)
    return
  }

  // Initialiser la situation du studySite si pas encore fait
  if (!studySiteSituationMap[answerCourante.studySiteId]) {
    studySiteSituationMap[answerCourante.studySiteId] = {
      mainSituation: {},
      listLayoutSituations: {} as Record<CutRuleName, CutSituation[]>,
    }
  }

  if (
    questionCourante.type === 'TABLE' &&
    questionsPublicodesMapping.TABLE?.[questionCourante.idIntern as InternQuestionId] === 'TABLEAU'
  ) {
    await processTableAnswer(answerCourante, questionCourante)
    return
  }

  if (
    questionCourante.type === 'TABLE' &&
    questionsPublicodesMapping.TABLE?.[questionCourante.idIntern as InternQuestionId]?.[0] === 'LISTE'
  ) {
    const listRule = questionsPublicodesMapping.TABLE?.[questionCourante.idIntern as InternQuestionId]?.[1]
    if (typeof listRule === 'string') {
      await processListAnswer(answerCourante, listRule)
    }
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

  if (isListItemFrom) {
    // we add the item to the correct list layout situation according to the isListItemFrom key
    if (!studySiteSituationMap[answerCourante.studySiteId].listLayoutSituations[isListItemFrom as CutRuleName]) {
      studySiteSituationMap[answerCourante.studySiteId].listLayoutSituations[isListItemFrom as CutRuleName] = []
    }
    // we merge the new situation state into the last item of the list but we only keep one item per list entry
    const list = studySiteSituationMap[answerCourante.studySiteId].listLayoutSituations[isListItemFrom as CutRuleName]
    if (list.length === 0) {
      list.push({})
    }
    Object.assign(list[list.length - 1], situationState)
  } else {
    // Merge la situation formatée dans la situation principale du studySite
    Object.assign(studySiteSituationMap[answerCourante.studySiteId].mainSituation, situationState)
  }
}

async function main() {
  const allAnswers = await prismaClient.answer.findMany({})

  await Promise.all(allAnswers.map((answer) => processAnswer({ answerCourante: answer })))

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

  // Group list layout situations by rule and drop row IDs

  Object.entries(studySiteSituationMap).forEach(([, site]) => {
    const formattedListLayout: Record<CutRuleName, CutSituation[]> = {} as Record<CutRuleName, CutSituation[]>
    for (const [key, situationArray] of Object.entries(site.listLayoutSituations)) {
      const [ruleName] = key.split(' | ')
      if (!formattedListLayout[ruleName as CutRuleName]) {
        formattedListLayout[ruleName as CutRuleName] = []
      }
      // Flatten per-row arrays (usually length 1) into the aggregated list
      for (const item of situationArray as CutSituation[]) {
        formattedListLayout[ruleName as CutRuleName].push(item)
      }
    }
    site.listLayoutSituations = formattedListLayout
  })

  console.log('Mapped situation for study site:', studySiteSituationMap)

  // Check dans l'engine avant de save la situation
  const engine = getCutEngine()

  for (const [studySiteId, situation] of Object.entries(studySiteSituationMap)) {
    try {
      engine.setSituation(situation.mainSituation)
      engine.evaluate('bilan')

      for (const [listRule, listSituation] of Object.entries(situation.listLayoutSituations)) {
        engine.setSituation({
          [listRule]: listSituation,
        })
        engine.evaluate(listRule)
      }
    } catch (e) {
      console.error(`Error evaluating situation for study site ID ${studySiteId}:`, e)
    }
  }

  // Sauvegader la situation
  //   await Promise.all(Object.entries(studySiteSituationMap).map(([studySiteId, situation]) =>
  //      upsertSituation(studySiteId, situation as InputJsonValue, PUBLICODES_COUNT_VERSION)
  // ))
}

console.log('Startig migration')
const startTime = Date.now()
main().then(() => {
  const duration = Date.now() - startTime
  console.log(`Migration done successfully (${duration}ms)`)
})
