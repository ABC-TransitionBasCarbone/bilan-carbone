import { ENTITY_CATEGORY_FACTORS, SurveyCategoryKey } from '@/constants/survey'
import { SurveyResults } from '@/types/results.types'
import { roundTo } from '@abc-transitionbascarbone/utils/number'
import { Situation } from 'publicodes'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
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

const getGroupFactor = (groupKey: string, factors: Partial<Record<SurveyCategoryKey, number>>) => {
  return factors[groupKey as SurveyCategoryKey] ?? 1
}

export function getResultsForEntity(results: SurveyResults, entityId: string): SurveyResults {
  if (entityId === 'all') {
    return results
  }

  const factors = ENTITY_CATEGORY_FACTORS[entityId] ?? {}
  const scaledCategories = results.categories.map((category) => ({
    ...category,
    value: Math.round(category.value * (factors[category.key as SurveyCategoryKey] ?? 1)),
  }))

  const baseTotal = results.categories.reduce((sum, category) => sum + category.value, 0)
  const scaledTotal = scaledCategories.reduce((sum, category) => sum + category.value, 0)
  const totalFactor = baseTotal > 0 ? scaledTotal / baseTotal : 1

  return {
    ...results,
    averageFootprint: Math.round(results.averageFootprint * totalFactor),
    categories: scaledCategories,
    keyStats: results.keyStats.map((group) => {
      const groupFactor = getGroupFactor(group.key, factors)

      return {
        ...group,
        stats: group.stats.map((stat) => {
          if (stat.unit === 'percent') {
            return {
              ...stat,
              value: Math.min(100, roundTo(stat.value * groupFactor, 1)),
            }
          }

          return {
            ...stat,
            value: roundTo(stat.value * groupFactor, 1),
          }
        }),
      }
    }),
  }
}
