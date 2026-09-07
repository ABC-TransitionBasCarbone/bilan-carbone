import { isObject } from '@abc-transitionbascarbone/utils/object'
import {
  compareSuggestionEntries,
  getRelativeRuleName,
  isSuggestionInputValue,
  NumericSuggestionEntry,
  SuggestionEntry,
  SuggestionInputValue,
} from './utils'

export type { NumericSuggestionEntry, SuggestionInputValue }
export type SuggestionValue = SuggestionInputValue | Record<string, unknown>
export type SuggestionsRecord = Record<string, SuggestionValue>

export type MosaicSuggestionEntry<RuleName extends string> = {
  label: string
  values: {
    ruleName: RuleName
    value: SuggestionInputValue
  }[]
}

export const parseSuggestionRecord = (suggestions?: Record<string, unknown>): SuggestionEntry[] => {
  if (!suggestions || !isObject(suggestions)) {
    return []
  }

  return Object.entries(suggestions)
    .filter((entry): entry is [string, SuggestionInputValue] => isSuggestionInputValue(entry[1]))
    .map(([label, value]) => ({ label, value }))
}

export const getNumericSuggestionEntries = (suggestions?: Record<string, unknown>): NumericSuggestionEntry[] => {
  return parseSuggestionRecord(suggestions)
    .filter((entry): entry is NumericSuggestionEntry => typeof entry.value === 'number' && Number.isFinite(entry.value))
    .sort(compareSuggestionEntries)
}

const getMosaicRuleMap = <RuleName extends string>(parentRuleName: RuleName, elements: { id: RuleName }[]) => {
  const fullRuleByRelativeName = new Map<string, RuleName>()
  for (const element of elements) {
    const relativeRuleName = getRelativeRuleName(parentRuleName, element.id)
    if (relativeRuleName) {
      fullRuleByRelativeName.set(relativeRuleName, element.id)
    }
  }

  return fullRuleByRelativeName
}


export const getMosaicSuggestionEntries = <RuleName extends string>(
  parentRuleName: RuleName,
  elements: { id: RuleName }[],
  suggestions?: Record<string, unknown>,
): MosaicSuggestionEntry<RuleName>[] => {
  if (!suggestions || !isObject(suggestions)) {
    return []
  }

  const fullRuleByRelativeName = getMosaicRuleMap(parentRuleName, elements)
  const entries: MosaicSuggestionEntry<RuleName>[] = []

  for (const [label, rawSuggestion] of Object.entries(suggestions)) {
    if (!isObject(rawSuggestion)) {
      continue
    }

    const parsedSuggestion = parseSuggestionRecord(rawSuggestion)
    const values = parsedSuggestion
      .map(({ label: relativeRuleName, value }) => {
        const fullRuleName = fullRuleByRelativeName.get(relativeRuleName)
        if (!fullRuleName) {
          return null
        }

        return { ruleName: fullRuleName, value }
      })
      .filter((value): value is MosaicSuggestionEntry<RuleName>['values'][number] => value !== null)

    if (values.length > 0) {
      entries.push({ label, values })
    }
  }

  return entries
}
