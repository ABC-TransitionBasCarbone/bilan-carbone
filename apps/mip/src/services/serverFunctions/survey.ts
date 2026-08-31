'use server'

import { createResponse } from '@/db/campaign'
import { getSurveyCampaignForCsvExport, getSurveyCampaignForResults } from '@/db/survey'
import { createMipEngine, getSurveyCategoryKeysFromRawRules, RawRules } from '@/publicodes/mip-engine'
import { dbActualizedAuth } from '@/services/auth'
import { EmissionCategory, EntityFilterResult, KeyStatGroup, SurveyResults } from '@/types/results.types'
import { getEntityFilterDefsFromModel } from '@/utils/entityFilter'
import { withServerResponse } from '@/utils/serverResponse'
import {
  buildEntityFilterResults,
  computeAggregatesForSituations,
  createEmptyCategories,
  resolveKeyStatsRules,
} from '@/utils/survey'
import { isAdmin } from '@/utils/user'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/services/permissions/check'
import { buildCsv, sanitizeFileName, serializeCsvValue } from '@abc-transitionbascarbone/utils/csv'
import { toNumber, safePercent, average } from '@abc-transitionbascarbone/utils/number'
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

const RULE_NAME_SEPARATOR = ' . '

const FOOTPRINT_VARIABLE_NAMES = [
  'bilan',
  'DT',
  'DT . voiture',
  'DT . train',
  'DT . transports commun',
  'DT . deux roues',
  'DT . mobilité douce',
  'transport',
  'transport . voiture',
  'transport . train',
  'transport . transports commun',
  'transport . deux roues',
  'transport . mobilité douce',
  'transport . avion',
  'transport . taxi',
  'transport . hébergement',
  'alimentation',
  'alimentation . repas',
  'alimentation . déjeuner',
  'alimentation . déforestation',
  'alimentation . boisson',
  'alimentation . boisson . chaude',
  'alimentation . boisson . froide',
  'alimentation . boisson . eau en bouteille',
  'numérique',
  'numérique . ia',
  'numérique . visio',
  'numérique . appareils',
  'bureaux',
  'bureaux . déchets',
  'bureaux . énergie',
]

const getSurveyQuestionColumns = (rules: RawRules, categoryKeys: string[]): SurveyQuestionColumn[] => {
  const typedRules = rules as Record<string, unknown>

  const columns = Object.entries(typedRules)
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

  return columns.sort((a, b) => {
    const getCategoryIndex = (ruleName: string) => {
      const firstSegment = ruleName.split(RULE_NAME_SEPARATOR)[0]
      const idx = categoryKeys.indexOf(firstSegment)
      return idx === -1 ? categoryKeys.length : idx
    }

    const catA = getCategoryIndex(a.ruleName)
    const catB = getCategoryIndex(b.ruleName)
    if (catA !== catB) {
      return catA - catB
    }
    return a.ruleName.localeCompare(b.ruleName)
  })
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
      key: 'DT',
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
      key: 'transport',
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
      key: 'alimentation',
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
      key: 'divers',
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
  const session = await dbActualizedAuth()
  if (!session?.user) {
    return null
  }

  const canAccessAllOrganizationCampaigns = isAdmin(session.user.role)
  const canAccessEntityFilter = isAdmin(session.user.role)

  const campaign = await getSurveyCampaignForResults({
    campaignId,
    organizationVersionMipId: session.user.organizationVersionMipId,
    canAccessAllOrganizationCampaigns,
    accountMipId: session.user.accountMipId,
  })

  if (!campaign) {
    return null
  }

  const responses = campaign.responses
  const totalRespondents = responses.length
  const modelRules = campaign.modelCampaign.model as RawRules
  const keyStatsRules = resolveKeyStatsRules(modelRules)
  const categoryKeys = getSurveyCategoryKeysFromRawRules(modelRules)
  const entityFilterDefs = canAccessEntityFilter ? await getEntityFilterDefsFromModel(modelRules) : []

  const emptyCategories: EmissionCategory[] = createEmptyCategories(categoryKeys)

  if (totalRespondents === 0) {
    const emptyEntityFilters: EntityFilterResult[] = [
      { id: 'all', name: 'Tous', totalRespondents: 0, averageFootprint: 0, categories: emptyCategories, keyStats: [] },
      ...entityFilterDefs.map(({ name, value }) => ({
        id: String(value),
        name,
        totalRespondents: 0,
        averageFootprint: 0,
        categories: emptyCategories,
        keyStats: [],
      })),
    ]
    return {
      surveyId: campaignId,
      totalRespondents: 0,
      averageFootprint: 0,
      categories: emptyCategories,
      entities: canAccessEntityFilter ? emptyEntityFilters : [],
      comments: [],
      keyStats: [],
    }
  }

  const engine = createMipEngine(modelRules)
  const situations: Situation<string>[] = responses.map((response) => {
    const formState = parseStoredFormState(response.answers)
    return formState.situation ?? {}
  })

  const { averageFootprint, categories, keyStats } = computeAggregatesForSituations(
    engine,
    situations,
    categoryKeys,
    emptyCategories,
    keyStatsRules,
  )

  return {
    surveyId: campaignId,
    totalRespondents,
    averageFootprint,
    categories,
    entities: canAccessEntityFilter
      ? buildEntityFilterResults(situations, entityFilterDefs, engine, categoryKeys, emptyCategories, keyStatsRules)
      : [],
    comments: [],
    keyStats,
  }
}

export const exportSurveyResponsesToCSV = async (campaignId: string) =>
  withServerResponse('exportSurveyResponsesToCSV', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      console.error('exportSurveyResponsesToCSV: unauthorized access', { campaignId })
      throw new Error(NOT_AUTHORIZED)
    }

    const canAccessAllOrganizationCampaigns = isAdmin(session.user.role)

    const campaign = await getSurveyCampaignForCsvExport({
      campaignId,
      organizationVersionMipId: session.user.organizationVersionMipId,
      canAccessAllOrganizationCampaigns,
      accountMipId: session.user.accountMipId,
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    const model = (campaign.modelCampaign.organizationVersionMip?.modelCampaign?.model ??
      campaign.modelCampaign.model) as RawRules
    const categoryKeys = getSurveyCategoryKeysFromRawRules(model)
    const questionColumns = getSurveyQuestionColumns(model, categoryKeys)
    const engine = createMipEngine(model)

    const evaluateFootprintVariable = (ruleName: string): number | null => {
      try {
        const node = engine.evaluate(ruleName)
        const value = node.nodeValue
        return typeof value === 'number' ? value : null
      } catch {
        return null
      }
    }

    const rows = campaign.responses.map((response, index) => {
      const parsedAnswers = parseStoredFormState(response.answers)
      const situation = (parsedAnswers.situation ?? {}) as Record<string, unknown>

      engine.setSituation(situation as Situation<string>)

      return [
        String(index + 1),
        response.createdAt.toISOString(),
        ...questionColumns.map((column) => serializeCsvValue(situation[column.ruleName])),
        ...FOOTPRINT_VARIABLE_NAMES.map((name) => serializeCsvValue(evaluateFootprintVariable(name))),
      ]
    })

    const questionHeaderVariableNames = questionColumns.map((column) => column.ruleName)

    const csvContent = buildCsv(
      ['Index reponse', 'Date reponse', ...questionHeaderVariableNames, ...FOOTPRINT_VARIABLE_NAMES],
      rows,
    )

    const safeCampaignName = sanitizeFileName(campaign.name)
    return {
      fileName: `${safeCampaignName || 'campagne'}-reponses-utilisateurs.csv`,
      csvContent,
    }
  })
