import { reduceAST, RuleNode, utils } from 'publicodes'
import { EvaluatedFormLayout } from './layouts/evaluatedFormLayout'
import { FormLayout } from './layouts/formLayout'

export { getUpdatedSituationWithInputValue, situationsAreEqual } from '@/lib/publicodes/utils'

export type OnFieldChange<RuleName extends string> = (
  ruleName: RuleName,
  value: string | number | boolean | undefined,
) => void

export function getRuleNamesFromLayout<RuleName extends string>(layout: FormLayout<RuleName>): RuleName[] | undefined {
  switch (layout.type) {
    case 'input':
      return [layout.rule]
    case 'group':
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
