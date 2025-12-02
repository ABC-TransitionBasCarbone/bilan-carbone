import { EvaluatedFormLayout, FormLayout } from '@publicodes/forms'
import { reduceAST, RuleNode, utils } from 'publicodes'

export type OnFormInputChange<RuleName extends string> = (
  ruleName: RuleName,
  value: string | number | boolean | undefined,
) => void

export function getRuleNameFromLayout<RuleName extends string>(layout: FormLayout<RuleName>): RuleName | undefined {
  switch (layout.type) {
    case 'simple':
      return layout.rule
    case 'group':
      return layout.rules[0]
    case 'table':
      return layout.rows[0]?.[0]
  }
}

export function evaluatedLayoutIsApplicable<RuleName extends string>(layout: EvaluatedFormLayout<RuleName>): boolean {
  switch (layout.type) {
    case 'simple':
      return layout.evaluatedElement.applicable
    case 'group':
      return layout.evaluatedElements.some((el) => el.applicable)
    case 'table':
      return layout.evaluatedRows.flat().some((el) => el.applicable)
  }
}

export function isRuleReferencedInApplicability<RuleName extends string>(
  getRuleNode: (rule: RuleName) => RuleNode<RuleName>,
  current: RuleName,
  previous: RuleName,
): boolean {
  const currentNode = getRuleNode(current)
  if (hasReferencedInApplicability(currentNode, previous)) {
    return true
  }

  const parents = utils.ruleParents(current) as RuleName[]
  for (const parent of parents) {
    const parentNode = getRuleNode(parent)
    if (hasReferencedInApplicability(parentNode, previous)) {
      return true
    }
  }

  return false
}

function hasReferencedInApplicability<RuleName extends string>(
  currentNode: RuleNode<RuleName>,
  previous: RuleName,
): boolean {
  return reduceAST(
    (found, node) => {
      if (found) {
        return true
      }

      if (node.sourceMap?.mecanismName === 'applicable si' || node.sourceMap?.mecanismName === 'non applicable si') {
        return reduceAST(
          (_, node) => {
            if (node.nodeKind === 'reference' && node.dottedName === previous) {
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
