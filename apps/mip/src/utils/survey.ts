import { SurveyResults } from '@/types/results.types'
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
