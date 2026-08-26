import { isObject } from '@abc-transitionbascarbone/utils/object'
import Engine, { parsePublicodes } from 'publicodes'

export type RawRules = Parameters<typeof parsePublicodes>[0]

const RULE_NAME_SEPARATOR = ' . '

const getMissingParentRuleNames = (rules: Record<string, unknown>): string[] => {
  const existing = new Set(Object.keys(rules))
  const missing = new Set<string>()

  for (const ruleName of existing) {
    const parts = ruleName.split(RULE_NAME_SEPARATOR)
    if (parts.length < 2) {
      continue
    }

    for (let depth = 1; depth < parts.length; depth++) {
      const parentName = parts.slice(0, depth).join(RULE_NAME_SEPARATOR)
      if (!existing.has(parentName)) {
        missing.add(parentName)
      }
    }
  }

  return [...missing]
}

const normalizeRulesWithMissingParents = (rules: RawRules): RawRules => {
  if (!isObject(rules)) {
    return rules
  }

  const normalizedRules: Record<string, unknown> = { ...rules }
  const missingParents = getMissingParentRuleNames(normalizedRules)

  for (const parentName of missingParents) {
    // Publicodes requires every dotted rule to have its parent namespace declared.
    normalizedRules[parentName] = {}
  }

  return normalizedRules as RawRules
}

export function createMipEngine(rules: RawRules): Engine {
  return new Engine(normalizeRulesWithMissingParents(rules), {
    flag: { filterNotApplicablePossibilities: true },
  })
}

const KNOWN_SURVEY_CATEGORY_KEYS = ['DT', 'transport', 'alimentation', 'divers', 'logement'] as const

const getSurveyCategoryKeysFromRules = (rules: Record<string, unknown>): string[] => {
  const bilanRule = rules.bilan
  const bilanSum =
    isObject(bilanRule) && Array.isArray(bilanRule.somme)
      ? bilanRule.somme
      : isObject(bilanRule) && isObject(bilanRule.rawNode) && Array.isArray(bilanRule.rawNode.somme)
        ? bilanRule.rawNode.somme
        : undefined

  if (bilanSum) {
    const categoryKeys = new Set<string>()

    for (const value of bilanSum) {
      if (typeof value !== 'string') {
        continue
      }

      const ruleName = value.trim()
      if (!ruleName || ruleName.includes(RULE_NAME_SEPARATOR)) {
        continue
      }

      categoryKeys.add(ruleName)
    }

    if (categoryKeys.size > 0) {
      return [...categoryKeys]
    }
  }

  return KNOWN_SURVEY_CATEGORY_KEYS.filter((key) => key in rules)
}

export const getSurveyCategoryKeysFromRawRules = (rules: RawRules): string[] => {
  return getSurveyCategoryKeysFromRules(rules as Record<string, unknown>)
}

export const getSurveyCategoryKeysFromParsedRules = (parsedRules: ReturnType<Engine['getParsedRules']>): string[] => {
  return getSurveyCategoryKeysFromRules(parsedRules as Record<string, unknown>)
}
