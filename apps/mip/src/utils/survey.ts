import { ENTITY_CATEGORY_FACTORS, SurveyCategoryKey } from '@/constants/survey'
import { SurveyResults } from '@/types/results.types'
import { roundTo } from '@abc-transitionbascarbone/utils/number'

const getGroupFactor = (groupKey: string, factors: Partial<Record<SurveyCategoryKey, number>>) => {
  if (groupKey === 'commute' || groupKey === 'travel' || groupKey === 'food' || groupKey === 'digital') {
    return factors[groupKey] ?? 1
  }

  return 1
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
