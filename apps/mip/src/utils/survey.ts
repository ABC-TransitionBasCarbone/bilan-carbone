import { CATEGORY_COLORS } from '@/constants/style'
import { RawRules } from '@/publicodes/mip-engine'
import { EmissionCategory, EntityFilterResult, KeyStatGroup, SurveyResults } from '@/types/results.types'
import { EntityFilterDef, groupSituationsByEntityFilter, keepOnlyExistingRules } from '@/utils/entityFilter'
import { evaluateRuleValue, safeEvaluate } from '@abc-transitionbascarbone/publicodes/utils'
import { average, countTrue, numericValues, safePercent, toNumber } from '@abc-transitionbascarbone/utils/number'
import { isYesValue } from '@abc-transitionbascarbone/utils/parsing'
import Engine, { Situation } from 'publicodes'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

export type StoredFormState = {
  situation?: Situation<string>
}

export type SurveyQuestionColumn = {
  ruleName: string
}

export type KeyStatsRules = {
  travelKmRules: string[]
  travelNightsRules: string[]
  dtCarPresent: string | null
  dtPublicTransportPresent: string | null
  dtActiveModePresent: string | null
  dtTwoWheelsPresent: string | null
  dtCarKm: string | null
  dtPublicTransportKm: string | null
  veganMeals: string | null
  vegetarianMeals: string | null
  whiteMeatMeals: string | null
  redMeatMeals: string | null
  fatFishMeals: string | null
  whiteFishMeals: string | null
  aiRequests: string | null
  videoHours: string | null
  internetHours: string | null
  trainPresent: string | null
  carTravelPresent: string | null
  planePresent: string | null
}

export const parseStoredFormState = (answers: unknown): StoredFormState => {
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

export const getRuleValue = (engine: Engine, key: string | null): unknown => evaluateRuleValue(engine, key ?? undefined)

export const getNumericRuleValue = (engine: Engine, key: string | null): number | null =>
  toNumber(getRuleValue(engine, key))

export const sumRuleValues = (engine: Engine, keys: string[]): number =>
  keys.reduce((sum, key) => sum + (getNumericRuleValue(engine, key) ?? 0), 0)

export const resolveKeyStatsRules = (rules: RawRules): KeyStatsRules => ({
  travelKmRules: keepOnlyExistingRules(rules, [
    'transport . voiture . km',
    'transport . train . km',
    'transport . taxi . km',
    'transport . avion . km',
    'transport . transports commun . km',
    'transport . deux roues . km',
  ]),
  travelNightsRules: keepOnlyExistingRules(rules, [
    'transport . hébergement . nuitées . nombre',
    'transport . hébergement . nuitées . hotel . nombre de nuitées',
    'transport . hébergement . nuitées . locations . nombre de nuitées',
  ]),
  dtCarPresent: keepOnlyExistingRules(rules, ['DT . voiture . présent'])[0] ?? null,
  dtPublicTransportPresent: keepOnlyExistingRules(rules, ['DT . transports commun . présent'])[0] ?? null,
  dtActiveModePresent: keepOnlyExistingRules(rules, ['DT . mobilité douce . présent'])[0] ?? null,
  dtTwoWheelsPresent: keepOnlyExistingRules(rules, ['DT . deux roues . présent'])[0] ?? null,
  dtCarKm: keepOnlyExistingRules(rules, ['DT . voiture . km'])[0] ?? null,
  dtPublicTransportKm: keepOnlyExistingRules(rules, ['DT . transports commun . km'])[0] ?? null,
  veganMeals: keepOnlyExistingRules(rules, ['alimentation . plats . végétalien . nombre'])[0] ?? null,
  vegetarianMeals: keepOnlyExistingRules(rules, ['alimentation . plats . végétarien . nombre'])[0] ?? null,
  whiteMeatMeals: keepOnlyExistingRules(rules, ['alimentation . plats . viande blanche . nombre'])[0] ?? null,
  redMeatMeals: keepOnlyExistingRules(rules, ['alimentation . plats . viande rouge . nombre'])[0] ?? null,
  fatFishMeals: keepOnlyExistingRules(rules, ['alimentation . plats . poisson gras . nombre'])[0] ?? null,
  whiteFishMeals: keepOnlyExistingRules(rules, ['alimentation . plats . poisson blanc . nombre'])[0] ?? null,
  aiRequests:
    keepOnlyExistingRules(rules, [
      'numérique . ia . nombre de requêtes par jour',
      'divers . numérique . ia . nombre de requêtes par jour',
    ])[0] ?? null,
  videoHours:
    keepOnlyExistingRules(rules, [
      'numérique . visio . durée journalière',
      'divers . numérique . visio . durée journalière',
    ])[0] ?? null,
  internetHours:
    keepOnlyExistingRules(rules, [
      'numérique . internet . durée journalière',
      'divers . numérique . internet . durée journalière',
    ])[0] ?? null,
  trainPresent: keepOnlyExistingRules(rules, ['transport . train . présent'])[0] ?? null,
  carTravelPresent: keepOnlyExistingRules(rules, ['transport . voiture . présent'])[0] ?? null,
  planePresent: keepOnlyExistingRules(rules, ['transport . avion . présent'])[0] ?? null,
})

export const getSurveyQuestionColumns = (rules: RawRules): SurveyQuestionColumn[] => {
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

      return {
        ruleName,
      }
    })
    .filter((column): column is SurveyQuestionColumn => column !== null)
}

const buildKeyStats = (
  engine: Engine,
  situations: Situation<string>[],
  commuteEmissionsKg: number[],
  travelEmissionsKg: number[],
  keyStatsRules: KeyStatsRules,
): KeyStatGroup[] => {
  const respondentCount = situations.length

  const rows = situations.map((situation) => {
    engine.setSituation(situation)
    const ev = (key: string | null): unknown => getRuleValue(engine, key)

    const vegan = getNumericRuleValue(engine, keyStatsRules.veganMeals) ?? 0
    const vegetarian = getNumericRuleValue(engine, keyStatsRules.vegetarianMeals) ?? 0
    const whiteMeat = getNumericRuleValue(engine, keyStatsRules.whiteMeatMeals) ?? 0
    const redMeat = getNumericRuleValue(engine, keyStatsRules.redMeatMeals) ?? 0
    const fatFish = getNumericRuleValue(engine, keyStatsRules.fatFishMeals) ?? 0
    const whiteFish = getNumericRuleValue(engine, keyStatsRules.whiteFishMeals) ?? 0
    const knownMeals = vegan + vegetarian + whiteMeat + redMeat + fatFish + whiteFish
    const travelKm = sumRuleValues(engine, keyStatsRules.travelKmRules)
    const travelNights = sumRuleValues(engine, keyStatsRules.travelNightsRules)

    return {
      dtCarPresent: isYesValue(ev(keyStatsRules.dtCarPresent)),
      dtPublicTransportPresent: isYesValue(ev(keyStatsRules.dtPublicTransportPresent)),
      dtActiveModePresent:
        isYesValue(ev(keyStatsRules.dtActiveModePresent)) || isYesValue(ev(keyStatsRules.dtTwoWheelsPresent)),
      dtCarKm: getNumericRuleValue(engine, keyStatsRules.dtCarKm),
      dtPublicTransportKm: getNumericRuleValue(engine, keyStatsRules.dtPublicTransportKm),
      travelKm: travelKm > 0 ? travelKm : null,
      veganMeals: getNumericRuleValue(engine, keyStatsRules.veganMeals),
      vegetarianMeals: getNumericRuleValue(engine, keyStatsRules.vegetarianMeals),
      totalMeals: knownMeals,
      fullyVegetarian: knownMeals > 0 && vegan + vegetarian > 0 && whiteMeat + redMeat + fatFish + whiteFish === 0,
      fullyVegan: vegan > 0 && vegetarian + whiteMeat + redMeat + fatFish + whiteFish === 0,
      redMeatDaily: redMeat >= 5,
      aiRequests: getNumericRuleValue(engine, keyStatsRules.aiRequests),
      videoHours: getNumericRuleValue(engine, keyStatsRules.videoHours),
      internetHours: getNumericRuleValue(engine, keyStatsRules.internetHours),
      trainPresent: isYesValue(ev(keyStatsRules.trainPresent)),
      carTravelPresent: isYesValue(ev(keyStatsRules.carTravelPresent)),
      planePresent: isYesValue(ev(keyStatsRules.planePresent)),
      travelNights: travelNights > 0 ? travelNights : null,
    }
  })

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
            countTrue(rows, (r) => r.dtCarPresent),
            respondentCount,
          ),
          unit: 'percent',
        },
        {
          key: 'publicTransportModeShare',
          value: safePercent(
            countTrue(rows, (r) => r.dtPublicTransportPresent),
            respondentCount,
          ),
          unit: 'percent',
        },
        {
          key: 'activeModeShare',
          value: safePercent(
            countTrue(rows, (r) => r.dtActiveModePresent),
            respondentCount,
          ),
          unit: 'percent',
        },
        { key: 'avgCarKm', value: average(numericValues(rows, (r) => r.dtCarKm)), unit: 'km' },
        { key: 'avgPublicTransportKm', value: average(numericValues(rows, (r) => r.dtPublicTransportKm)), unit: 'km' },
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
            countTrue(rows, (r) => r.trainPresent),
            respondentCount,
          ),
          unit: 'percent',
        },
        {
          key: 'carTravelModeShare',
          value: safePercent(
            countTrue(rows, (r) => r.carTravelPresent),
            respondentCount,
          ),
          unit: 'percent',
        },
        {
          key: 'planeTravelModeShare',
          value: safePercent(
            countTrue(rows, (r) => r.planePresent),
            respondentCount,
          ),
          unit: 'percent',
        },
        { key: 'avgTravelKmByMode', value: average(numericValues(rows, (r) => r.travelKm)), unit: 'km' },
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
            numericValues(rows, (r) => r.travelNights),
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
            countTrue(rows, (r) => r.fullyVegetarian),
            respondentCount,
          ),
          unit: 'percent',
        },
        {
          key: 'fullyVeganEmployees',
          value: safePercent(
            countTrue(rows, (r) => r.fullyVegan),
            respondentCount,
          ),
          unit: 'percent',
        },
        {
          key: 'redMeatDailyEmployees',
          value: safePercent(
            countTrue(rows, (r) => r.redMeatDaily),
            respondentCount,
          ),
          unit: 'percent',
        },
      ],
    },
    {
      key: 'divers',
      stats: [
        { key: 'aiRequestsPerDay', value: average(numericValues(rows, (r) => r.aiRequests)), unit: 'number' },
        {
          key: 'videoHoursPerDay',
          value: average(
            numericValues(rows, (r) => r.videoHours),
            1,
          ),
          unit: 'hours',
        },
        {
          key: 'internetHoursPerDay',
          value: average(
            numericValues(rows, (r) => r.internetHours),
            1,
          ),
          unit: 'hours',
        },
      ],
    },
  ]
}

export const createEmptyCategories = (categoryKeys: string[]): EmissionCategory[] =>
  categoryKeys.map((key) => ({
    key,
    labelFr: '',
    value: 0,
    color: CATEGORY_COLORS[key] ?? CATEGORY_COLORS.total,
  }))

export const computeAggregatesForSituations = (
  engine: Engine,
  filteredSituations: Situation<string>[],
  categoryKeys: string[],
  emptyCategories: EmissionCategory[],
  keyStatsRules: KeyStatsRules,
): { totalRespondents: number; averageFootprint: number; categories: EmissionCategory[]; keyStats: KeyStatGroup[] } => {
  if (filteredSituations.length === 0) {
    return { totalRespondents: 0, averageFootprint: 0, categories: emptyCategories, keyStats: [] }
  }

  const categoryTotals = Object.fromEntries(categoryKeys.map((key) => [key, 0])) as Record<string, number>
  const commuteEmissionsKg: number[] = []
  const travelEmissionsKg: number[] = []
  let footprintTotal = 0

  for (const situation of filteredSituations) {
    engine.setSituation(situation)
    footprintTotal += safeEvaluate(engine, 'bilan')
    const commuteEmission = safeEvaluate(engine, 'DT')
    if (commuteEmission > 0) {
      commuteEmissionsKg.push(Math.max(0, commuteEmission))
    }
    const travelEmission = safeEvaluate(engine, 'transport')
    if (travelEmission > 0) {
      travelEmissionsKg.push(Math.max(0, travelEmission))
    }
    for (const key of categoryKeys) {
      categoryTotals[key] += safeEvaluate(engine, key)
    }
  }

  const count = filteredSituations.length
  return {
    totalRespondents: count,
    averageFootprint: Math.round(footprintTotal / count),
    categories: categoryKeys.map((key) => ({
      key,
      labelFr: '',
      value: Math.round(categoryTotals[key] / count),
      color: CATEGORY_COLORS[key] ?? CATEGORY_COLORS.total,
    })),
    keyStats: buildKeyStats(engine, filteredSituations, commuteEmissionsKg, travelEmissionsKg, keyStatsRules),
  }
}

export const buildEntityFilterResults = (
  allSituations: Situation<string>[],
  entityFilterDefs: EntityFilterDef[],
  engine: Engine,
  categoryKeys: string[],
  emptyCategories: EmissionCategory[],
  keyStatsRules: KeyStatsRules,
): EntityFilterResult[] => {
  const allAggregates = computeAggregatesForSituations(
    engine,
    allSituations,
    categoryKeys,
    emptyCategories,
    keyStatsRules,
  )
  const allFilter: EntityFilterResult = { id: 'all', name: 'Tous', ...allAggregates }
  const situationsByFilter = groupSituationsByEntityFilter(allSituations)

  const entityFilters: EntityFilterResult[] = entityFilterDefs.map(({ name, value }) => {
    const entitySituations = situationsByFilter.get(value) ?? []
    return {
      id: String(value),
      name,
      ...computeAggregatesForSituations(engine, entitySituations, categoryKeys, emptyCategories, keyStatsRules),
    }
  })

  return [allFilter, ...entityFilters]
}

export const normalizeSituation = (value: unknown): Situation<string> | null => {
  if (!isRecord(value)) {
    return null
  }

  const normalized = Object.entries(value).reduce<Situation<string>>((acc, [key, entry]) => {
    if (typeof entry === 'string' || typeof entry === 'number') {
      acc[key] = entry
    } else if (typeof entry === 'boolean') {
      acc[key] = entry ? 'oui' : 'non'
    }
    return acc
  }, {})

  return Object.keys(normalized).length > 0 ? normalized : null
}

export function getResultsForEntity(results: SurveyResults, entityId: string): SurveyResults {
  if (entityId === 'all') {
    return results
  }

  const entityResult = results.entities.find((e) => e.id === entityId)
  if (!entityResult) {
    return results
  }

  return {
    ...results,
    totalRespondents: entityResult.totalRespondents,
    averageFootprint: entityResult.averageFootprint,
    categories: entityResult.categories,
    keyStats: entityResult.keyStats,
  }
}
