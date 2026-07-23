'use server'

import { CATEGORY_COLORS } from '@/constants/style'
import { CATEGORY_MAP, DEFAULT_ENTITY_FILTERS } from '@/constants/survey'
import { createResponse } from '@/db/campaign'
import { prismaClient } from '@/db/client.server'
import { getCampaignWithModelForSurvey, getResponsesByCampaignId } from '@/db/survey'
import { createMipEngine, RawRules } from '@/publicodes/mip-engine'
import { dbActualizedAuth } from '@/services/auth'
import { EmissionCategory, KeyStatGroup, SurveyResults } from '@/types/results.types'
import { withServerResponse } from '@/utils/serverResponse'
import { isAdmin } from '@/utils/user'
import { buildCsv, sanitizeFileName, serializeCsvValue } from '@abc-transitionbascarbone/utils/csv'
import { average, safePercent, toNumber } from '@abc-transitionbascarbone/utils/number'
import { isYesValue } from '@abc-transitionbascarbone/utils/parsing'
import Engine, { Situation } from 'publicodes'

type StoredFormState = {
  situation?: Situation<string>
}

type SurveyQuestionColumn = {
  ruleName: string
  headerLabel: string
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

const getSurveyQuestionColumns = (rules: RawRules): SurveyQuestionColumn[] => {
  const typedRules = rules as Record<string, unknown>

  return Object.entries(typedRules)
    .map(([ruleName, ruleValue]) => {
      if (!ruleValue || typeof ruleValue !== 'object') {
        return null
      }

      const typedRule = ruleValue as Record<string, unknown>
      const question = typedRule.question
      if (typeof question !== 'string' || question.trim().length === 0) {
        return null
      }

      const unit = typedRule['unité']
      const normalizedUnit = typeof unit === 'string' ? unit.trim() : ''
      const headerLabel = normalizedUnit
        ? `${question.trim()} [${ruleName}] (${normalizedUnit})`
        : `${question.trim()} [${ruleName}]`

      return {
        ruleName,
        headerLabel,
      }
    })
    .filter((column): column is SurveyQuestionColumn => column !== null)
}

const buildKeyStats = (
  engine: Engine,
  situations: Situation<string>[],
  commuteEmissionsKg: number[],
  travelEmissionsKg: number[],
): KeyStatGroup[] => {
  const respondentCount = situations.length

  const travelKmRules = [
    'transport . voiture . km',
    'transport . train . km',
    'transport . taxi . km',
    'transport . avion . km',
    'transport . transports commun . km',
    'transport . deux roues . km',
  ]

  const mealRules = [
    'alimentation . plats . végétalien . nombre',
    'alimentation . plats . végétarien . nombre',
    'alimentation . plats . viande blanche . nombre',
    'alimentation . plats . viande rouge . nombre',
    'alimentation . plats . poisson gras . nombre',
    'alimentation . plats . poisson blanc . nombre',
  ] as const

  const rows = situations.map((situation) => {
    engine.setSituation(situation)
    const ev = (key: string): unknown => {
      try {
        return engine.evaluate(key).nodeValue
      } catch {
        return undefined
      }
    }
    const num = (key: string) => toNumber(ev(key))

    const [vegan, vegetarian, whiteMeat, redMeat, fatFish, whiteFish] = mealRules.map((k) => num(k) ?? 0)
    const knownMeals = vegan + vegetarian + whiteMeat + redMeat + fatFish + whiteFish
    const travelKm = travelKmRules.map((k) => num(k) ?? 0).reduce((a, b) => a + b, 0)

    return {
      dtCarPresent: isYesValue(ev('DT . voiture . présent')),
      dtPublicTransportPresent: isYesValue(ev('DT . transports commun . présent')),
      dtActiveModePresent:
        isYesValue(ev('DT . mobilité douce . présent')) || isYesValue(ev('DT . deux roues . présent')),
      dtCarKm: num('DT . voiture . km'),
      dtPublicTransportKm: num('DT . transports commun . km'),
      travelKm: travelKm > 0 ? travelKm : null,
      veganMeals: num('alimentation . plats . végétalien . nombre'),
      vegetarianMeals: num('alimentation . plats . végétarien . nombre'),
      totalMeals: knownMeals,
      fullyVegetarian: knownMeals > 0 && vegan + vegetarian > 0 && whiteMeat + redMeat + fatFish + whiteFish === 0,
      fullyVegan: vegan > 0 && vegetarian + whiteMeat + redMeat + fatFish + whiteFish === 0,
      redMeatDaily: redMeat >= 5,
      aiRequests: num('divers . numérique . ia . nombre de requêtes par jour'),
      videoHours: num('divers . numérique . visio . durée journalière'),
      internetHours: num('divers . numérique . internet . durée journalière'),
      trainPresent: isYesValue(ev('transport . train . présent')),
      carTravelPresent: isYesValue(ev('transport . voiture . présent')),
      planePresent: isYesValue(ev('transport . avion . présent')),
      travelNights: num('transport . hébergement . nuitées . nombre'),
    }
  })

  type Row = (typeof rows)[0]
  const countTrue = (fn: (row: Row) => boolean) => rows.filter(fn).length
  const numericValues = (fn: (row: Row) => number | null) => rows.map(fn).filter((v): v is number => v !== null)

  const totalMeals = rows.reduce((sum, r) => sum + r.totalMeals, 0)
  const totalVeganMeals = rows.reduce((sum, r) => sum + (r.veganMeals ?? 0), 0)
  const totalVegetarianMeals = rows.reduce((sum, r) => sum + (r.vegetarianMeals ?? 0), 0)

  return [
    {
      key: 'commute',
      stats: [
        {
          key: 'carModeShare',
          value: safePercent(
            countTrue((r) => r.dtCarPresent),
            respondentCount,
          ),
          unit: 'percent',
        },
        {
          key: 'publicTransportModeShare',
          value: safePercent(
            countTrue((r) => r.dtPublicTransportPresent),
            respondentCount,
          ),
          unit: 'percent',
        },
        {
          key: 'activeModeShare',
          value: safePercent(
            countTrue((r) => r.dtActiveModePresent),
            respondentCount,
          ),
          unit: 'percent',
        },
        { key: 'avgCarKm', value: average(numericValues((r) => r.dtCarKm)), unit: 'km' },
        { key: 'avgPublicTransportKm', value: average(numericValues((r) => r.dtPublicTransportKm)), unit: 'km' },
        {
          key: 'avgEmissionPerMode',
          value: average(
            commuteEmissionsKg.map((v) => v / 1000),
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
          value: safePercent(
            countTrue((r) => r.trainPresent),
            respondentCount,
          ),
          unit: 'percent',
        },
        {
          key: 'carTravelModeShare',
          value: safePercent(
            countTrue((r) => r.carTravelPresent),
            respondentCount,
          ),
          unit: 'percent',
        },
        {
          key: 'planeTravelModeShare',
          value: safePercent(
            countTrue((r) => r.planePresent),
            respondentCount,
          ),
          unit: 'percent',
        },
        { key: 'avgTravelKmByMode', value: average(numericValues((r) => r.travelKm)), unit: 'km' },
        {
          key: 'avgTravelEmissionByMode',
          value: average(
            travelEmissionsKg.map((v) => v / 1000),
            1,
          ),
          unit: 'number',
        },
        {
          key: 'avgTravelNights',
          value: average(
            numericValues((r) => r.travelNights),
            1,
          ),
          unit: 'nights',
        },
      ],
    },
    {
      key: 'food',
      stats: [
        { key: 'vegMealsShare', value: safePercent(totalVegetarianMeals, totalMeals), unit: 'percent' },
        { key: 'veganMealsShare', value: safePercent(totalVeganMeals, totalMeals), unit: 'percent' },
        {
          key: 'fullyVegetarianEmployees',
          value: safePercent(
            countTrue((r) => r.fullyVegetarian),
            respondentCount,
          ),
          unit: 'percent',
        },
        {
          key: 'fullyVeganEmployees',
          value: safePercent(
            countTrue((r) => r.fullyVegan),
            respondentCount,
          ),
          unit: 'percent',
        },
        {
          key: 'redMeatDailyEmployees',
          value: safePercent(
            countTrue((r) => r.redMeatDaily),
            respondentCount,
          ),
          unit: 'percent',
        },
      ],
    },
    {
      key: 'digital',
      stats: [
        { key: 'aiRequestsPerDay', value: average(numericValues((r) => r.aiRequests)), unit: 'number' },
        {
          key: 'videoHoursPerDay',
          value: average(
            numericValues((r) => r.videoHours),
            1,
          ),
          unit: 'hours',
        },
        {
          key: 'internetHoursPerDay',
          value: average(
            numericValues((r) => r.internetHours),
            1,
          ),
          unit: 'hours',
        },
      ],
    },
  ]
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

  const keyStats = buildKeyStats(engine, situations, commuteEmissionsKg, travelEmissionsKg)

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

export const exportSurveyResponsesToCSV = async (campaignId: string) =>
  withServerResponse('exportSurveyResponsesToCSV', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    const canAccessAllOrganizationCampaigns = isAdmin(session.user.role)

    const campaign = await prismaClient.campaign.findFirst({
      where: {
        id: campaignId,
        modelCampaign: {
          organizationVersionMip: {
            id: session.user.organizationVersionMipId,
          },
        },
        ...(canAccessAllOrganizationCampaigns
          ? {}
          : { allowedAccounts: { some: { accountMipId: session.user.accountMipId } } }),
      },
      select: {
        id: true,
        name: true,
        responses: {
          select: {
            id: true,
            createdAt: true,
            answers: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        modelCampaign: {
          select: {
            model: true,
            organizationVersionMip: {
              select: {
                modelCampaign: {
                  select: {
                    model: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    const model = (campaign.modelCampaign.organizationVersionMip?.modelCampaign?.model ??
      campaign.modelCampaign.model) as RawRules
    const questionColumns = getSurveyQuestionColumns(model)

    const rows = campaign.responses.map((response, index) => {
      const parsedAnswers = parseStoredFormState(response.answers)
      const situation = (parsedAnswers.situation ?? {}) as Record<string, unknown>

      return [
        String(index + 1),
        response.createdAt.toISOString(),
        ...questionColumns.map((column) => serializeCsvValue(situation[column.ruleName])),
      ]
    })

    const csvContent = buildCsv(
      ['Index reponse', 'Date reponse', ...questionColumns.map((column) => column.headerLabel)],
      rows,
    )

    const safeCampaignName = sanitizeFileName(campaign.name)
    return {
      fileName: `${safeCampaignName || 'campagne'}-reponses-utilisateurs.csv`,
      csvContent,
    }
  })
