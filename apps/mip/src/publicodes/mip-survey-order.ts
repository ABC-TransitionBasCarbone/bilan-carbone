import {
    FILTER_RULE_KEY,
    getMosaicParent,
    getRuleCategoryKey,
} from '@abc-transitionbascarbone/publicodes/form/utils'
import { normalizeCategoryKey } from '@abc-transitionbascarbone/utils/parsing'
import type { ParsedRules as PublicodesParsedRules } from 'publicodes'
import Engine, { utils } from 'publicodes'

type ParsedRuleRawNode = {
    question?: unknown
    mosaique?: { options?: string[] }
    ordre?: number | string
    somme?: unknown
    formule?: unknown
    variations?: unknown
    [key: string]: unknown
}

type ParsedRule = {
    rawNode?: ParsedRuleRawNode
    [key: string]: unknown
}

export type ParsedRules = Record<string, ParsedRule>

type VariationWithSum = {
    alors?: {
        somme?: unknown
    }
}

export const getRuleOrder = (rawNode: ParsedRuleRawNode | undefined): number | null => {
    const ordre = rawNode?.ordre
    const value = typeof ordre === 'number' ? ordre : Number.parseFloat(ordre ?? '')
    return Number.isFinite(value) ? value : null
}

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(Boolean)

const getSumFromVariations = (variations: unknown): string[] | undefined => {
    if (!Array.isArray(variations)) {
        return undefined
    }

    return variations.find((variation: VariationWithSum) => isStringArray(variation?.alors?.somme))?.alors?.somme
}

export const getRuleSum = (rawNode: ParsedRuleRawNode | undefined): string[] | undefined => {
    if (!rawNode) {
        return undefined
    }

    if (rawNode.formule && typeof rawNode.formule === 'object') {
        const formula = rawNode.formule as Record<string, unknown>
        if (isStringArray(formula.somme)) {
            return formula.somme
        }

        const variationSum = getSumFromVariations(formula.variations)
        if (variationSum) {
            return variationSum
        }
    }

    if (isStringArray(rawNode.somme)) {
        return rawNode.somme
    }

    return getSumFromVariations(rawNode.variations)
}

const resolveRuleName = (parsedRules: ParsedRules, parent: string, ruleName: string): string => {
    if (parsedRules[ruleName]) {
        return ruleName
    }

    const relativeRuleName = `${parent} . ${ruleName}`
    if (Object.keys(parsedRules).some((parsedRuleName) => parsedRuleName.startsWith(relativeRuleName))) {
        return relativeRuleName
    }

    try {
        return utils.disambiguateReference(parsedRules as PublicodesParsedRules, parent, ruleName)
    } catch {
        return ruleName
    }
}

const getResolvedRuleSum = (parsedRules: ParsedRules, parent: string): string[] => {
    const sum = getRuleSum(parsedRules[parent]?.rawNode) ?? []
    return sum.map((ruleName) => resolveRuleName(parsedRules, parent, ruleName))
}

const indexRules = (rules: string[]): Map<string, number> => new Map(rules.map((ruleName, index) => [ruleName, index]))

const getCategoryIndexes = (parsedRules: ParsedRules, rootRule: string): Map<string, number> =>
    indexRules(getResolvedRuleSum(parsedRules, rootRule).map(normalizeCategoryKey))

const getCategoryOrder = (ruleName: string, categoryIndexes: Map<string, number>): number =>
    categoryIndexes.get(normalizeCategoryKey(getRuleCategoryKey(ruleName))) ?? Number.MAX_SAFE_INTEGER

const getPriorityOrder = (rawNode: ParsedRuleRawNode | undefined): number | null => {
    const order = getRuleOrder(rawNode)
    return order !== null && order < 0 ? order : null
}

const getMosaicOptionOrder = (engine: Engine, parsedRules: ParsedRules, ruleName: string): number => {
    const mosaicParent = getMosaicParent(engine, ruleName)
    if (!mosaicParent) {
        return Number.MAX_SAFE_INTEGER
    }

    const options = parsedRules[mosaicParent]?.rawNode?.mosaique?.options ?? []
    const optionIndex = options
        .map((option) => resolveRuleName(parsedRules, mosaicParent, option))
        .findIndex((option) => option === ruleName)
    return optionIndex === -1 ? Number.MAX_SAFE_INTEGER : optionIndex
}

const getMosaicOptionDiff = (engine: Engine, parsedRules: ParsedRules, a: string, b: string): number => {
    const aMosaicParent = getMosaicParent(engine, a)
    const bMosaicParent = getMosaicParent(engine, b)

    if (!aMosaicParent || aMosaicParent !== bMosaicParent) {
        return 0
    }

    return getMosaicOptionOrder(engine, parsedRules, a) - getMosaicOptionOrder(engine, parsedRules, b)
}

export const compareModelOrderedRuleNames = (
    engine: Engine,
    rootRule: string,
    a: string,
    b: string,
    initialIndexes: Map<string, number>,
): number => {
    const parsedRules = engine.getParsedRules() as ParsedRules
    const categoryIndexes = getCategoryIndexes(parsedRules, rootRule)
    const priorityDiff = Number(b === FILTER_RULE_KEY) - Number(a === FILTER_RULE_KEY)
    if (priorityDiff !== 0) {
        return priorityDiff
    }

    const categoryDiff = getCategoryOrder(a, categoryIndexes) - getCategoryOrder(b, categoryIndexes)

    if (categoryDiff !== 0) {
        return categoryDiff
    }

    const priorityOrderDiff =
        (getPriorityOrder(parsedRules[a]?.rawNode) ?? Number.MAX_SAFE_INTEGER) -
        (getPriorityOrder(parsedRules[b]?.rawNode) ?? Number.MAX_SAFE_INTEGER)
    if (priorityOrderDiff !== 0) {
        return priorityOrderDiff
    }

    const directOrderDiff =
        (getRuleOrder(parsedRules[a]?.rawNode) ?? Number.MAX_SAFE_INTEGER) -
        (getRuleOrder(parsedRules[b]?.rawNode) ?? Number.MAX_SAFE_INTEGER)
    if (directOrderDiff !== 0) {
        return directOrderDiff
    }

    const mosaicOptionDiff = getMosaicOptionDiff(engine, parsedRules, a, b)
    if (mosaicOptionDiff !== 0) {
        return mosaicOptionDiff
    }

    const nameDiff = a.localeCompare(b)
    if (nameDiff !== 0) {
        return nameDiff
    }

    return (initialIndexes.get(a) ?? Number.MAX_SAFE_INTEGER) - (initialIndexes.get(b) ?? Number.MAX_SAFE_INTEGER)
}

export const sortFieldsByModelOrder = (engine: Engine, fields: string[], rootRule = 'bilan'): string[] => {
    const parsedRules = engine.getParsedRules() as ParsedRules
    const visibleFields = fields.filter((field) => parsedRules[field]?.rawNode?.question !== undefined)
    const initialIndexes = new Map(visibleFields.map((field, index) => [field, index]))

    return [...visibleFields].sort((a, b) => compareModelOrderedRuleNames(engine, rootRule, a, b, initialIndexes))
}
