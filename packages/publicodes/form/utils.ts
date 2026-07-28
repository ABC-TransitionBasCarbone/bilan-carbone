import { EvaluatedFormElement, FormPageElementProp, FormPages } from '@publicodes/forms'
import Engine, { reduceAST, RuleNode, utils } from 'publicodes'
import { EvaluatedFormLayout } from './layouts/evaluatedFormLayout'
import { FormLayout } from './layouts/formLayout'

export { getUpdatedSituationWithInputValue, situationsAreEqual } from '../utils'

export type OnFieldChange<RuleName extends string = string> = (
  ruleName: RuleName,
  value: string | number | boolean | undefined,
) => void

export function getRuleNamesFromLayout<RuleName extends string>(layout: FormLayout<RuleName>): RuleName[] | undefined {
  switch (layout.type) {
    case 'input':
      return [layout.rule]
    case 'group':
    case 'list':
      return layout.rules
    case 'table':
      return layout.rows.flat()
  }
}

export function evaluatedLayoutIsApplicable<RuleName extends string>(layout: EvaluatedFormLayout<RuleName>): boolean {
  switch (layout.type) {
    case 'input':
      return layout.evaluatedElement.applicable
    case 'mosaic':
      return layout.evaluatedParent.applicable
    case 'group':
      return layout.evaluatedElements.some((el) => el.applicable)
    case 'table':
      return layout.evaluatedRows.flat().some((el) => el.applicable)
    case 'list':
      return layout.evaluatedTargetElement.applicable
  }
}

export function areRulesReferencedInApplicability<RuleName extends string>(
  getRuleNode: (rule: RuleName) => RuleNode<RuleName>,
  currents: RuleName[],
  previous: RuleName[],
): boolean {
  return currents.some((current) => {
    const allNodes = [current, ...(utils.ruleParents(current) as RuleName[])]
    return allNodes.some((name) => areReferencedInApplicability(getRuleNode(name), previous))
  })
}

function areReferencedInApplicability<RuleName extends string>(
  currentNode: RuleNode<RuleName>,
  previous: RuleName[],
): boolean {
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

export function getMosaicParent(engine: Engine, ruleName: string): string | null {
  const rules = engine.getParsedRules()
  const parts = ruleName.split(' . ')

  for (let i = parts.length - 1; i > 0; i--) {
    const parent = parts.slice(0, i).join(' . ')
    const parentRule = rules[parent]?.rawNode as any
    if (parentRule?.mosaique) {
      const options = parentRule.mosaique.options ?? []
      const relativeRuleName = parts.slice(i).join(' . ')
      if (options.includes(relativeRuleName)) {
        return parent
      }
    }
  }
  return null
}

const DEFAULT_SURVEY_CATEGORY_ORDER = ['DT', 'transport', 'alimentation', 'divers', 'logement']
const MAX = Number.MAX_SAFE_INTEGER
const normalize = (n: number) => (n === -1 ? MAX : n)

const getRuleOrder = (rawNode: unknown): number | null => {
  const ordre = (rawNode as { ordre?: unknown } | null)?.ordre
  if (typeof ordre === 'number' && Number.isFinite(ordre)) return ordre
  if (typeof ordre === 'string') {
    const n = Number.parseFloat(ordre)
    if (Number.isFinite(n)) return n
  }
  return null
}

const compareRuleNames = (
  a: string,
  b: string,
  parsedRules: ReturnType<Engine['getParsedRules']>,
  initialIndexes: Map<string, number>,
) => {
  const [aRoot] = a.split(' . ')
  const [bRoot] = b.split(' . ')

  const catDiff = normalize(DEFAULT_SURVEY_CATEGORY_ORDER.indexOf(aRoot)) - normalize(DEFAULT_SURVEY_CATEGORY_ORDER.indexOf(bRoot))
  if (catDiff !== 0) return catDiff

  const aParts = a.split(' . ')
  const bParts = b.split(' . ')

  for (let depth = 1; depth <= Math.max(aParts.length, bParts.length); depth++) {
    const aOrder = getRuleOrder(parsedRules[aParts.slice(0, depth).join(' . ')]?.rawNode)
    const bOrder = getRuleOrder(parsedRules[bParts.slice(0, depth).join(' . ')]?.rawNode)
    if (aOrder !== null || bOrder !== null) {
      const diff = (aOrder ?? MAX) - (bOrder ?? MAX)
      if (diff !== 0) return diff
    }
  }

  const initDiff = (initialIndexes.get(a) ?? MAX) - (initialIndexes.get(b) ?? MAX)
  return initDiff !== 0 ? initDiff : a.localeCompare(b)
}

export function buildPageBuilder(engine: Engine) {
  return (fields: string[]): FormPages<string> => {
    const rules = engine.getParsedRules()
    const initialIndexes = new Map(fields.map((f, i) => [f, i]))
    const sortedFields = fields
      .filter((f) => (rules[f]?.rawNode as any)?.question !== undefined)
      .sort((a, b) => compareRuleNames(a, b, rules, initialIndexes))

    const pages: FormPages<string> = []
    const seen = new Set<string>()

    for (const field of sortedFields) {
      const mosaicParent = getMosaicParent(engine, field)
      if (mosaicParent && !seen.has(mosaicParent)) {
        seen.add(mosaicParent)
        pages.push({
          elements: sortedFields.filter((f) => getMosaicParent(engine, f) === mosaicParent),
          title: (engine.getParsedRules()[mosaicParent]?.rawNode as any)?.question,
        })
      } else if (!mosaicParent) {
        pages.push({ elements: [field] })
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

export function getQuestionType(engine: Engine, ruleName: string): MipQuestionType {
  const rules = engine.getParsedRules()
  const rule = rules[ruleName]

  if (!rule) return MipQuestionType.NotQuestion

  const raw = rule.rawNode as any

  if (!raw?.question) return MipQuestionType.NotQuestion
  if (raw?.mosaique) return MipQuestionType.Mosaic

  const evaluation = engine.evaluate(ruleName)

  if (
    (raw?.unité === undefined && typeof evaluation.nodeValue !== 'number') ||
    booleanSecureTypes.some((key) => ruleName.includes(key))
  ) {
    const unePossibilite = raw?.formule ? raw.formule['une possibilité'] : raw?.['une possibilité']

    return unePossibilite ? MipQuestionType.Choices : MipQuestionType.Boolean
  }

  return MipQuestionType.Number
}

export function patchFormElement<RuleName extends string>(
  el: EvaluatedFormElement<RuleName> & FormPageElementProp,
  questionType: MipQuestionType,
): EvaluatedFormElement<RuleName> & FormPageElementProp {
  if (el.element !== 'input') return el

  switch (questionType) {
    case 'boolean':
      return {
        ...el,
        element: 'RadioGroup',
        options: [
          { label: 'Oui', value: true },
          { label: 'Non', value: false },
        ],
      } as any
    case 'choices':
      return { ...el, element: 'select' } as any
    default:
      return el
  }
}
