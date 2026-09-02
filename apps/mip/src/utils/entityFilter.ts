import { RawRules } from '@/publicodes/mip-engine'
import { FILTER_RULE_KEY } from '@abc-transitionbascarbone/publicodes/form/utils'
import { doesKeyExist } from '@abc-transitionbascarbone/utils/object'
import { Situation } from 'publicodes'

export type EntityFilterDef = {
  name: string
  value: number
}

export const keepOnlyExistingRules = (rules: RawRules, candidates: readonly string[]): string[] =>
  candidates.filter((candidate) => doesKeyExist(rules, candidate))

export const getEntityFilterDefsFromModel = (rules: RawRules): EntityFilterDef[] => {
  const typedRules = rules as Record<string, unknown>
  const filterRule = typedRules[FILTER_RULE_KEY]

  if (!filterRule || typeof filterRule !== 'object') {
    return []
  }

  const suggestions = (filterRule as Record<string, unknown>).suggestions
  if (!suggestions || typeof suggestions !== 'object') {
    return []
  }

  return Object.entries(suggestions)
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => a.value - b.value)
}

export const groupSituationsByEntityFilter = (allSituations: Situation<string>[]) => {
  const situationsByFilter = new Map<number, Situation<string>[]>()

  for (const situation of allSituations) {
    const rawFilterValue = situation[FILTER_RULE_KEY]
    const numericFilterValue = Number(rawFilterValue)

    if (!Number.isFinite(numericFilterValue)) {
      continue
    }

    const groupedSituations = situationsByFilter.get(numericFilterValue) ?? []
    groupedSituations.push(situation)
    situationsByFilter.set(numericFilterValue, groupedSituations)
  }

  return situationsByFilter
}
