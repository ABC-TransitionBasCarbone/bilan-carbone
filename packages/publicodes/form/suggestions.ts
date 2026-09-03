import { isObject } from '@abc-transitionbascarbone/utils/object'
import {
  getRelativeRuleName,
  isSuggestionInputValue,
  NumericSuggestionEntry,
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


export const getMosaicSuggestionEntries = <RuleName extends string>(
  parentRuleName: RuleName,
  elements: { id: RuleName }[],
  suggestions?: Record<string, unknown>,
): MosaicSuggestionEntry<RuleName>[] => {
  if (!suggestions || !isObject(suggestions)) {
    return []
  }

  const fullRuleByRelativeName = new Map<string, RuleName>()
  for (const element of elements) {
    const relativeRuleName = getRelativeRuleName(parentRuleName, element.id)
    if (relativeRuleName) {
      fullRuleByRelativeName.set(relativeRuleName, element.id)
    }
  }

  const entries: MosaicSuggestionEntry<RuleName>[] = []

  for (const [label, rawSuggestion] of Object.entries(suggestions)) {
    if (!isObject(rawSuggestion)) {
      continue
    }

    const values: MosaicSuggestionEntry<RuleName>['values'] = []

    for (const [relativeRuleName, rawValue] of Object.entries(rawSuggestion)) {
      if (!isSuggestionInputValue(rawValue)) {
        continue
      }

      const fullRuleName = fullRuleByRelativeName.get(relativeRuleName)
      if (!fullRuleName) {
        continue
      }

      values.push({
        ruleName: fullRuleName,
        value: rawValue,
      })
    }

    if (values.length > 0) {
      entries.push({ label, values })
    }
  }

  return entries
}
