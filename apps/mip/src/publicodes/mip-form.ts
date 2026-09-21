import { SURVEY_CATEGORY_KEYS } from '@/constants/survey'
import {
  getRuleCategoryKey,
  getRuleNameParts,
  getRuleSubCategoryKey,
  joinRuleNameParts,
} from '@abc-transitionbascarbone/publicodes/form/utils'
import { normalizeCategoryKey } from '@abc-transitionbascarbone/utils/parsing'
import { EvaluatedFormElement, FormPageElementProp, FormPages } from '@publicodes/forms'
import Engine from 'publicodes'

type ParsedRuleRawNode = {
  question?: unknown
  mosaique?: { options?: string[] }
  ordre?: number | string
  [key: string]: unknown
}

type ParsedRule = {
  rawNode?: ParsedRuleRawNode
  [key: string]: unknown
}

type ParsedRules = Record<string, ParsedRule>

export const getMosaicParent = (engine: Engine, ruleName: string): string | null => {
  const rules = engine.getParsedRules() as ParsedRules
  const parts = getRuleNameParts(ruleName)

  for (let i = parts.length - 1; i > 0; i--) {
    const parent = joinRuleNameParts(parts.slice(0, i))
    const parentRule = rules[parent]?.rawNode
    const mosaicOptions = parentRule?.mosaique?.options ?? []
    const relativeRuleName = joinRuleNameParts(parts.slice(i))

    if (parentRule?.mosaique && mosaicOptions.includes(relativeRuleName)) {
      return parent
    }
  }
  return null
}

const getQuestionText = (rule: ParsedRule | undefined): string | undefined => {
  const question = rule?.rawNode?.question
  return typeof question === 'string' ? question : undefined
}

const MAX = Number.MAX_SAFE_INTEGER

const getRuleOrder = (rawNode: ParsedRuleRawNode | undefined): number | null => {
  const ordre = rawNode?.ordre
  if (typeof ordre === 'number' && Number.isFinite(ordre)) {
    return ordre
  }
  if (typeof ordre === 'string') {
    const n = Number.parseFloat(ordre)
    if (Number.isFinite(n)) {
      return n
    }
  }
  return null
}

const compareRuleNames = (a: string, b: string, parsedRules: ParsedRules, initialIndexes: Map<string, number>) => {
  const aRoot = normalizeCategoryKey(getRuleCategoryKey(a))
  const bRoot = normalizeCategoryKey(getRuleCategoryKey(b))
  const aCategoryIndex = SURVEY_CATEGORY_KEYS.findIndex((key) => normalizeCategoryKey(key) === aRoot)
  const bCategoryIndex = SURVEY_CATEGORY_KEYS.findIndex((key) => normalizeCategoryKey(key) === bRoot)
  const categoryDiff = (aCategoryIndex === -1 ? MAX : aCategoryIndex) - (bCategoryIndex === -1 ? MAX : bCategoryIndex)

  if (categoryDiff !== 0) {
    return categoryDiff
  }

  const aBranch = getRuleSubCategoryKey(a)
  const bBranch = getRuleSubCategoryKey(b)
  if (aBranch !== bBranch) {
    const branchIndexes = new Map<string, number>()
    for (const [ruleName, index] of initialIndexes) {
      const branch = getRuleSubCategoryKey(ruleName)
      if (!branchIndexes.has(branch)) {
        branchIndexes.set(branch, index)
      }
    }

    const branchDiff = (branchIndexes.get(aBranch) ?? MAX) - (branchIndexes.get(bBranch) ?? MAX)
    if (branchDiff !== 0) {
      return branchDiff
    }
  }

  const aParts = getRuleNameParts(a)
  const bParts = getRuleNameParts(b)
  const directOrderDiff =
    (getRuleOrder(parsedRules[a]?.rawNode) ?? MAX) - (getRuleOrder(parsedRules[b]?.rawNode) ?? MAX)
  if (directOrderDiff !== 0) {
    return directOrderDiff
  }

  for (let depth = 1; depth <= Math.max(aParts.length, bParts.length); depth++) {
    const aParent = joinRuleNameParts(aParts.slice(0, depth))
    const bParent = joinRuleNameParts(bParts.slice(0, depth))
    const aOrder = getRuleOrder(parsedRules[aParent]?.rawNode)
    const bOrder = getRuleOrder(parsedRules[bParent]?.rawNode)
    if (aOrder !== null || bOrder !== null) {
      const diff = (aOrder ?? MAX) - (bOrder ?? MAX)
      if (diff !== 0) {
        return diff
      }
    }
  }

  const initialDiff = (initialIndexes.get(a) ?? MAX) - (initialIndexes.get(b) ?? MAX)
  return initialDiff !== 0 ? initialDiff : a.localeCompare(b)
}

export const buildPageBuilder = (engine: Engine) => {
  return (fields: string[]): FormPages<string> => {
    const rules = engine.getParsedRules() as ParsedRules
    const initialIndexes = new Map(fields.map((field, index) => [field, index]))
    const sortedFields = fields
      .filter((field) => rules[field]?.rawNode?.question !== undefined)
      .sort((a, b) => compareRuleNames(a, b, rules, initialIndexes))

    const pages: FormPages<string> = []
    const mosaicPagesByParent = new Map<string, FormPages<string>[number]>()

    for (const field of sortedFields) {
      const mosaicParent = getMosaicParent(engine, field)
      if (!mosaicParent) {
        pages.push({ elements: [field] })
        continue
      }

      const existingPage = mosaicPagesByParent.get(mosaicParent)
      if (existingPage) {
        existingPage.elements.push(field)
      } else {
        const newPage = {
          elements: [field],
          title: getQuestionText(rules[mosaicParent]),
        }
        mosaicPagesByParent.set(mosaicParent, newPage)
        pages.push(newPage)
      }
    }

    return pages
  }
}

export enum MipQuestionType {
  NotQuestion = 'notQuestion',
  Mosaic = 'mosaic',
  Choices = 'choices',
  Boolean = 'boolean',
  Number = 'number',
}

const booleanSecureTypes = ['présent', 'propriétaire']

const getChoiceOption = (rawNode: ParsedRuleRawNode | undefined): unknown => {
  if (!rawNode) {
    return undefined
  }

  if (Object.prototype.hasOwnProperty.call(rawNode, 'une possibilité')) {
    return Object.getOwnPropertyDescriptor(rawNode, 'une possibilité')?.value
  }

  const formula = rawNode.formule
  return formula && typeof formula === 'object'
    ? Object.getOwnPropertyDescriptor(formula, 'une possibilité')?.value
    : undefined
}

export const getQuestionType = (engine: Engine, ruleName: string): MipQuestionType => {
  const rules = engine.getParsedRules() as ParsedRules
  const rule = rules[ruleName]

  if (!rule) {
    return MipQuestionType.NotQuestion
  }

  const raw = rule.rawNode
  if (!raw?.question) {
    return MipQuestionType.NotQuestion
  }
  if (raw.mosaique) {
    return MipQuestionType.Mosaic
  }

  const evaluation = engine.evaluate(ruleName)
  const unePossibilite = getChoiceOption(raw)

  if (
    (raw.unité === undefined && typeof evaluation.nodeValue !== 'number') ||
    booleanSecureTypes.some((key) => ruleName.includes(key))
  ) {
    return unePossibilite ? MipQuestionType.Choices : MipQuestionType.Boolean
  }

  return MipQuestionType.Number
}

type PatchedFormElement<RuleName extends string> = EvaluatedFormElement<RuleName> & FormPageElementProp

export const patchFormElement = <RuleName extends string>(
  el: EvaluatedFormElement<RuleName> & FormPageElementProp,
  questionType: MipQuestionType,
): PatchedFormElement<RuleName> => {
  if (el.element !== 'input') {
    return el
  }

  switch (questionType) {
    case MipQuestionType.Boolean:
      return {
        ...el,
        element: 'RadioGroup',
        options: [
          { label: 'Oui', value: true },
          { label: 'Non', value: false },
        ],
      } as unknown as PatchedFormElement<RuleName>
    case MipQuestionType.Choices:
      return { ...el, element: 'select' } as unknown as PatchedFormElement<RuleName>
    default:
      return el
  }
}
