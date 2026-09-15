import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { EvaluatedFormElement } from '@publicodes/forms'
import Engine, { reduceAST, RuleNode, utils } from 'publicodes'
import { EvaluatedFormLayout, EvaluatedGroupLayout, EvaluatedListLayout, EvaluatedMosaicLayout, EvaluatedTableLayout } from './layouts/evaluatedFormLayout'
import { FormLayout } from './layouts/formLayout'

export { getUpdatedSituationWithInputValue, situationsAreEqual } from '../utils'

export type OnFieldChange<RuleName extends string = string> = (
  ruleName: RuleName,
  value: string | number | boolean | undefined,
) => void

export type SuggestionInputValue = string | number | boolean

export type SuggestionEntry<Value = SuggestionInputValue> = {
  label: string
  value: Value
}

export type NumericSuggestionEntry = SuggestionEntry<number>

export const FILTER_RULE_KEY = 'DT . filtrage'
export const RULE_NAME_SEPARATOR = ' . '

export const getRuleNameParts = (ruleName: string): string[] => {
  if (!ruleName) {
    return []
  }

  return ruleName.split(RULE_NAME_SEPARATOR)
}
export const joinRuleNameParts = (parts: string[]): string => parts.join(RULE_NAME_SEPARATOR)

export const getRelativeRuleName = (parentRuleName: string, ruleName: string): string | null => {
  const parentPrefix = `${parentRuleName}${RULE_NAME_SEPARATOR}`
  if (!ruleName.startsWith(parentPrefix)) {
    return null
  }

  const parentParts = getRuleNameParts(parentRuleName)
  const ruleParts = getRuleNameParts(ruleName)

  if (ruleParts.length <= parentParts.length) {
    return null
  }

  return joinRuleNameParts(ruleParts.slice(parentParts.length))
}

export const compareSuggestionEntries = (a: NumericSuggestionEntry, b: NumericSuggestionEntry): number => {
  const diff = a.value - b.value
  if (diff !== 0) {
    return diff
  }

  return a.label.localeCompare(b.label)
}

export const isSuggestionInputValue = (value: unknown): value is SuggestionInputValue => {
  if (typeof value === 'number') {
    return Number.isFinite(value)
  }

  return typeof value === 'string' || typeof value === 'boolean'
}

export const getRuleParentName = (ruleName: string): string | null => {
  const parts = getRuleNameParts(ruleName)
  return parts.length > 1 ? joinRuleNameParts(parts.slice(0, -1)) : null
}

export const getRuleCategoryKey = (ruleName: string): string => getRuleNameParts(ruleName)[0]

export const getCategoryClassSuffix = (categoryKey?: string | null): string => {
  if (!categoryKey) {
    return ''
  }
  return categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1).toLowerCase()
}

export const formatMassKilograms = (valueKg: number): string => {
  if (valueKg >= 1000) {
    return `${formatNumber(valueKg / 1000, 1)} t`
  }
  return `${formatNumber(Math.round(valueKg))} kg`
}

export const getRuleNamesFromLayout = <RuleName extends string>(layout: FormLayout<RuleName>): RuleName[] => {
  switch (layout.type) {
    case 'input':
      return [layout.rule]
    case 'group':
    case 'list':
      return layout.rules
    case 'table':
      return layout.rows.flat()
    case 'mosaic':
      return [layout.parent]
  }
}

export const hasDefaultValue = (el: EvaluatedFormElement<string>): boolean => {
  return 'defaultValue' in el && el.defaultValue !== null && el.defaultValue !== undefined && el.defaultValue !== 0
}

export const isGroupLayoutApplicable = (layout: EvaluatedGroupLayout<string>): boolean => {
  return layout.evaluatedElements.some((el) => el.applicable)
}

export const isGroupLayoutAnswered = (layout: EvaluatedGroupLayout<string>): boolean => {
  return layout.evaluatedElements.some((el) => el.applicable && el.answered)
}

export const isListLayoutApplicable = (layout: EvaluatedListLayout<string>): boolean => {
  return (
    layout.evaluatedTargetElement.applicable &&
    (layout.evaluatedListRows.length === 0 ||
      layout.evaluatedListRows.some((el) => el.elements.every((e) => e.applicable)))
  )
}
export const isListLayoutAnswered = (layout: EvaluatedListLayout<string>): boolean => {
  return layout.evaluatedListRows.some((el) =>
    el.elements.every((e) => !e.applicable || e.answered || hasDefaultValue(e)),
  )
}

export const isTableLayoutApplicable = (layout: EvaluatedTableLayout<string>): boolean => {
  return layout.evaluatedRows.flat().some((el) => el.applicable)
}

export const isTableLayoutAnswered = (layout: EvaluatedTableLayout<string>): boolean => {
  return layout.evaluatedRows.some((row) =>
    row.every(
      (el, i) =>
        // NOTE: the first column is the label, so we consider it answered
        i === 0 || !el.applicable || el.answered || hasDefaultValue(el),
    ),
  )
}

export const isMosaicLayoutApplicable = (layout: EvaluatedMosaicLayout<string>): boolean => {
  return layout.evaluatedParent.applicable && layout.evaluatedChildren.some((el) => el.applicable)
}

export const isMosaicLayoutAnswered = (layout: EvaluatedMosaicLayout<string>): boolean => {
  return layout.evaluatedChildren.some((el) => el.applicable && (el.answered || hasDefaultValue(el)))
}


export const evaluatedLayoutIsApplicable = <RuleName extends string>(layout: EvaluatedFormLayout<RuleName>): boolean => {
  switch (layout.type) {
    case 'input':
      return layout.evaluatedElement.applicable
    case 'mosaic':
      return isMosaicLayoutApplicable(layout)
    case 'group':
      return isGroupLayoutApplicable(layout)
    case 'table':
      return isTableLayoutApplicable(layout)
    case 'list':
      return isListLayoutApplicable(layout)
  }
}
export const areRulesReferencedInApplicability = <RuleName extends string>(
  getRuleNode: (rule: RuleName) => RuleNode<RuleName>,
  currents: RuleName[],
  previous: RuleName[],
): boolean => {
  return currents.some((current) => {
    const allNodes = [current, ...(utils.ruleParents(current) as RuleName[])]
    return allNodes.some((name) => areReferencedInApplicability(getRuleNode(name), previous))
  })
}

const areReferencedInApplicability = <RuleName extends string>(
  currentNode: RuleNode<RuleName>,
  previous: RuleName[],
): boolean => {
  return reduceAST(
    (found, node) => {
      if (found) {
        return true
      }

      if (node.sourceMap?.mecanismName === 'applicable si' || node.sourceMap?.mecanismName === 'non applicable si') {
        return reduceAST(
          (_, node) => {
            if (node.nodeKind === 'reference' && previous.includes(node.dottedName as RuleName)) {
              return true
            }
          },
          false,
          node,
        )
      }
    },
    false,
    currentNode,
  )
}

