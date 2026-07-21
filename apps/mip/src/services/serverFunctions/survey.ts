'use server'

import { CATEGORY_COLORS } from '@/data/sampleResults'
import { createResponse } from '@/db/campaign'
import { getCampaignWithModelForSurvey, getResponsesByCampaignId } from '@/db/survey'
import { createMipEngine, RawRules } from '@/publicodes/mip-engine'
import { EmissionCategory, EntityFilter, KeyStatGroup, SurveyResults } from '@/types/results.types'
import { withServerResponse } from '@/utils/serverResponse'
import { average, safePercent, toNumber } from '@abc-transitionbascarbone/utils/number'
import { isYesValue } from '@abc-transitionbascarbone/utils/parsing'
import { Situation } from 'publicodes'

const CATEGORY_MAP = [
  { key: 'commute', rule: 'DT' },
  { key: 'travel', rule: 'transport' },
  { key: 'food', rule: 'alimentation' },
  { key: 'digital', rule: 'divers' },
  { key: 'office', rule: 'logement' },
] as const

const DEFAULT_ENTITY_FILTERS: EntityFilter[] = [
  { id: 'all', name: 'Tous' },
  { id: 'rh', name: 'Ressources humaines' },
  { id: 'it', name: 'Informatique' },
  { id: 'commercial', name: 'Commercial' },
  { id: 'direction', name: 'Direction' },
]

type StoredFormState = {
  situation?: Situation<string>
}

const parseStoredFormState = (answers: unknown): StoredFormState => {
  if (typeof answers === 'string') {
    try {
      const parsed = JSON.parse(answers) as StoredFormState
      return parsed
    } catch {
      return {}
    }
  }

  if (answers && typeof answers === 'object') {
    return answers as StoredFormState
  }

  return {}
}

const buildKeyStats = (
  situations: Situation<string>[],
  commuteEmissionsKg: number[],
  travelEmissionsKg: number[],
): KeyStatGroup[] => {
  const respondentCount = situations.length

  const read = (situation: Situation<string>, key: string): unknown => situation[key]

  const countYes = (key: string) => situations.filter((situation) => isYesValue(read(situation, key))).length
  const getNumericValues = (key: string) =>
    situations.map((situation) => toNumber(read(situation, key))).filter((value): value is number => value !== null)

  const dtCarKmValues = getNumericValues('DT . voiture . km')
  const dtPublicTransportKmValues = getNumericValues('DT . transports commun . km')

  const travelKmKeys = [
    'transport . voiture . km',
    'transport . train . km',
    'transport . taxi . km',
    'transport . avion . km',
    'transport . transports commun . km',
    'transport . deux roues . km',
  ]
  const travelKmValues = situations
    .map((situation) =>
      travelKmKeys.map((key) => toNumber(read(situation, key)) ?? 0).reduce((sum, value) => sum + value, 0),
    )
    .filter((value) => value > 0)

  const veganMeals = getNumericValues('alimentation . plats . végétalien . nombre')
  const vegetarianMeals = getNumericValues('alimentation . plats . végétarien . nombre')
  const mealCountByRespondent = situations.map((situation) => {
    const keys = [
      'alimentation . plats . végétalien . nombre',
      'alimentation . plats . végétarien . nombre',
      'alimentation . plats . viande blanche . nombre',
      'alimentation . plats . viande rouge . nombre',
      'alimentation . plats . poisson gras . nombre',
      'alimentation . plats . poisson blanc . nombre',
    ]

    return keys.map((key) => toNumber(read(situation, key)) ?? 0).reduce((sum, value) => sum + value, 0)
  })

  const totalMeals = mealCountByRespondent.reduce((sum, value) => sum + value, 0)
  const fullyVegetarianCount = situations.filter((situation) => {
    const vegan = toNumber(read(situation, 'alimentation . plats . végétalien . nombre')) ?? 0
    const vegetarian = toNumber(read(situation, 'alimentation . plats . végétarien . nombre')) ?? 0
    const whiteMeat = toNumber(read(situation, 'alimentation . plats . viande blanche . nombre')) ?? 0
    const redMeat = toNumber(read(situation, 'alimentation . plats . viande rouge . nombre')) ?? 0
    const fish =
      (toNumber(read(situation, 'alimentation . plats . poisson gras . nombre')) ?? 0) +
      (toNumber(read(situation, 'alimentation . plats . poisson blanc . nombre')) ?? 0)
    const knownMeals = vegan + vegetarian + whiteMeat + redMeat + fish

    return knownMeals > 0 && vegan + vegetarian > 0 && whiteMeat + redMeat + fish === 0
  }).length

  const fullyVeganCount = situations.filter((situation) => {
    const vegan = toNumber(read(situation, 'alimentation . plats . végétalien . nombre')) ?? 0
    const others =
      (toNumber(read(situation, 'alimentation . plats . végétarien . nombre')) ?? 0) +
      (toNumber(read(situation, 'alimentation . plats . viande blanche . nombre')) ?? 0) +
      (toNumber(read(situation, 'alimentation . plats . viande rouge . nombre')) ?? 0) +
      (toNumber(read(situation, 'alimentation . plats . poisson gras . nombre')) ?? 0) +
      (toNumber(read(situation, 'alimentation . plats . poisson blanc . nombre')) ?? 0)
    return vegan > 0 && others === 0
  }).length

  const redMeatDailyCount = situations.filter((situation) => {
    const redMeat = toNumber(read(situation, 'alimentation . plats . viande rouge . nombre')) ?? 0
    return redMeat >= 5
  }).length

  const aiRequests = getNumericValues('divers . numérique . ia . nombre de requêtes par jour')
  const videoHours = getNumericValues('divers . numérique . visio . durée journalière')
  const internetHours = getNumericValues('divers . numérique . internet . durée journalière')

  const groups: KeyStatGroup[] = [
    {
      key: 'commute',
      stats: [
        {
          key: 'carModeShare',
          value: safePercent(countYes('DT . voiture . présent'), respondentCount),
          unit: 'percent',
        },
        {
          key: 'publicTransportModeShare',
          value: safePercent(countYes('DT . transports commun . présent'), respondentCount),
          unit: 'percent',
        },
        {
          key: 'activeModeShare',
          value: safePercent(
            situations.filter(
              (situation) =>
                isYesValue(read(situation, 'DT . mobilité douce . présent')) ||
                isYesValue(read(situation, 'DT . deux roues . présent')),
            ).length,
            respondentCount,
          ),
          unit: 'percent',
        },
        { key: 'avgCarKm', value: average(dtCarKmValues), unit: 'km' },
        { key: 'avgPublicTransportKm', value: average(dtPublicTransportKmValues), unit: 'km' },
        {
          key: 'avgEmissionPerMode',
          value: average(
            commuteEmissionsKg.map((value) => value / 1000),
            1,
          ),
          unit: 'number',
        },
      ],
    },
    {
      key: 'travel',
      stats: [
        {
          key: 'trainModeShare',
          value: safePercent(countYes('transport . train . présent'), respondentCount),
          unit: 'percent',
        },
        {
          key: 'carTravelModeShare',
          value: safePercent(countYes('transport . voiture . présent'), respondentCount),
          unit: 'percent',
        },
        {
          key: 'planeTravelModeShare',
          value: safePercent(countYes('transport . avion . présent'), respondentCount),
          unit: 'percent',
        },
        { key: 'avgTravelKmByMode', value: average(travelKmValues), unit: 'km' },
        {
          key: 'avgTravelEmissionByMode',
          value: average(
            travelEmissionsKg.map((value) => value / 1000),
            1,
          ),
          unit: 'number',
        },
        {
          key: 'avgTravelNights',
          value: average(getNumericValues('transport . hébergement . nuitées . nombre'), 1),
          unit: 'nights',
        },
      ],
    },
    {
      key: 'food',
      stats: [
        {
          key: 'vegMealsShare',
          value: safePercent(
            vegetarianMeals.reduce((sum, value) => sum + value, 0),
            totalMeals,
          ),
          unit: 'percent',
        },
        {
          key: 'veganMealsShare',
          value: safePercent(
            veganMeals.reduce((sum, value) => sum + value, 0),
            totalMeals,
          ),
          unit: 'percent',
        },
        { key: 'fullyVegetarianEmployees', value: safePercent(fullyVegetarianCount, respondentCount), unit: 'percent' },
        { key: 'fullyVeganEmployees', value: safePercent(fullyVeganCount, respondentCount), unit: 'percent' },
        { key: 'redMeatDailyEmployees', value: safePercent(redMeatDailyCount, respondentCount), unit: 'percent' },
      ],
    },
    {
      key: 'digital',
      stats: [
        { key: 'aiRequestsPerDay', value: average(aiRequests), unit: 'number' },
        { key: 'videoHoursPerDay', value: average(videoHours, 1), unit: 'hours' },
        { key: 'internetHoursPerDay', value: average(internetHours, 1), unit: 'hours' },
      ],
    },
  ]

  return groups
}

export const createSurveyResponse = async (campaignId: string, answers: string) =>
  withServerResponse('createSurveyResponse', async () => {
    await createResponse({
      answers,
      campaign: { connect: { id: campaignId } },
    })
  })

export const getSurveyResults = async (campaignId: string): Promise<SurveyResults | null> => {
  const campaign = await getCampaignWithModelForSurvey(campaignId)
  if (!campaign) {
    return null
  }

  const responses = await getResponsesByCampaignId(campaignId)
  const totalRespondents = responses.length

  const emptyCategories: EmissionCategory[] = CATEGORY_MAP.map(({ key }) => ({
    key,
    labelFr: '',
    value: 0,
    color: CATEGORY_COLORS[key],
  }))

  if (totalRespondents === 0) {
    return {
      surveyId: campaignId,
      totalRespondents: 0,
      averageFootprint: 0,
      categories: emptyCategories,
      entities: DEFAULT_ENTITY_FILTERS,
      comments: [],
      keyStats: [],
    }
  }

  const engine = createMipEngine(campaign.modelCampaign.model as RawRules)
  const categoryTotals: Record<string, number> = Object.fromEntries(CATEGORY_MAP.map(({ key }) => [key, 0]))
  const situations: Situation<string>[] = []
  const commuteEmissionsKg: number[] = []
  const travelEmissionsKg: number[] = []
  let footprintTotal = 0

  for (const response of responses) {
    const formState = parseStoredFormState(response.answers)
    const situation = formState.situation ?? {}
    situations.push(situation)

    engine.setSituation(situation)

    const bilanValue = engine.evaluate('bilan').nodeValue
    footprintTotal += typeof bilanValue === 'number' ? bilanValue : 0

    const commuteEmission = engine.evaluate('DT').nodeValue
    if (typeof commuteEmission === 'number') {
      commuteEmissionsKg.push(Math.max(0, commuteEmission))
    }

    const travelEmission = engine.evaluate('transport').nodeValue
    if (typeof travelEmission === 'number') {
      travelEmissionsKg.push(Math.max(0, travelEmission))
    }

    for (const { key, rule } of CATEGORY_MAP) {
      const value = engine.evaluate(rule).nodeValue
      categoryTotals[key] += typeof value === 'number' ? value : 0
    }
  }

  const keyStats = buildKeyStats(situations, commuteEmissionsKg, travelEmissionsKg)

  return {
    surveyId: campaignId,
    totalRespondents,
    averageFootprint: Math.round(footprintTotal / totalRespondents),
    categories: CATEGORY_MAP.map(({ key }) => ({
      key,
      labelFr: '',
      value: Math.round(categoryTotals[key] / totalRespondents),
      color: CATEGORY_COLORS[key],
    })),
    entities: DEFAULT_ENTITY_FILTERS,
    comments: [],
    keyStats,
  }
}
