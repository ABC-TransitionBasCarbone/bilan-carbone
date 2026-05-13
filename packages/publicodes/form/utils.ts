import { FormPages } from '@publicodes/forms'
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
    const currentNode = getRuleNode(current)
    if (areReferencedInApplicability(currentNode, previous)) {
      return true
    }

    const parents = utils.ruleParents(current) as RuleName[]
    for (const parent of parents) {
      const parentNode = getRuleNode(parent)
      if (areReferencedInApplicability(parentNode, previous)) {
        return true
      }
    }
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

export function isMosaic(engine: Engine, ruleName: string): boolean {
  return !!(engine.getParsedRules()[ruleName]?.rawNode as any)?.mosaique
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

export function buildPageBuilder(engine: Engine) {
  return (fields: string[]): FormPages<string> => {
    const rules = engine.getParsedRules()
    const filteredFields = fields.filter((field) => {
      const raw = rules[field]?.rawNode as any
      return raw?.question !== undefined
    })

    const pages: FormPages<string> = []
    const seen = new Set<string>()

    for (const field of filteredFields) {
      const mosaicParent = getMosaicParent(engine, field)
      if (mosaicParent) {
        if (!seen.has(mosaicParent)) {
          seen.add(mosaicParent)
          pages.push({
            elements: filteredFields.filter((f) => getMosaicParent(engine, f) === mosaicParent),
            title: (engine.getParsedRules()[mosaicParent]?.rawNode as any)?.question,
          })
        }
      } else {
        pages.push({ elements: [field] })
      }
    }
    return pages
  }
}
