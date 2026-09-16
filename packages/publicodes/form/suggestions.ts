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
  value: {
    ruleName: RuleName
    value: SuggestionInputValue
  }[]
}

export const parseSuggestionRecord = (suggestions?: Record<string, unknown>): SuggestionEntry[] => {
  if (!suggestions || !isObject(suggestions)) {
    return []
  }

  return Object.entries(suggestions).flatMap(([label, value]) =>
    isSuggestionInputValue(value) ? [{ label, value }] : [],
  )
}

export const getNumericSuggestionEntries = (suggestions?: Record<string, unknown>): NumericSuggestionEntry[] => {
  return parseSuggestionRecord(suggestions)
    .filter((entry): entry is NumericSuggestionEntry => typeof entry.value === 'number' && Number.isFinite(entry.value))
    .sort(compareSuggestionEntries)
}

export const getMosaicSuggestionEntries = <RuleName extends string>(
  parentRuleName: RuleName,
  elements: { id: RuleName }[],
  suggestions?: Record<string, unknown>,
): MosaicSuggestionEntry<RuleName>[] => {
  if (!suggestions || !isObject(suggestions)) {
    return []
  }

  const fullRuleByRelativeName = new Map<string, RuleName>(
    elements.flatMap((element) => {
      const relativeRuleName = getRelativeRuleName(parentRuleName, element.id)
      return relativeRuleName ? [[relativeRuleName, element.id] as const] : []
    }),
  )

  return Object.entries(suggestions).flatMap(([label, rawSuggestion]) => {
    if (!isObject(rawSuggestion)) {
      return []
    }

    const values = Object.entries(rawSuggestion).flatMap(([relativeRuleName, value]) => {
      const ruleName = fullRuleByRelativeName.get(relativeRuleName)
      if (!ruleName || !isSuggestionInputValue(value)) {
        return []
      }

      return [{ ruleName, value }]
    })

    return values.length === 0 ? [] : [{ label, value: values }]
  })
}
