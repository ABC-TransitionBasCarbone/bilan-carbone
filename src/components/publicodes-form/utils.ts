import { convertInputValueToPublicodes } from '@publicodes/forms'
import Engine, { reduceAST, RuleNode, Situation, utils } from 'publicodes'
import { EvaluatedFormLayout } from './layouts/evaluatedFormLayout'
import { FormLayout } from './layouts/formLayout'

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

/**
 * Returns an updated situation object with the new input value for the specified rule.
 *
 * If the input value is `undefined`, the rule is removed from the situation.
 */
export function getUpdatedSituationWithInputValue<RuleName extends string>(
  engine: Engine<RuleName>,
  currentSituation: Situation<RuleName>,
  dottedName: RuleName,
  inputValue: string | number | boolean | undefined,
): Situation<RuleName> {
  const situationValue = convertInputValueToPublicodes(engine, dottedName, inputValue)

  if (situationValue === undefined) {
    if (!(dottedName in currentSituation)) {
      return currentSituation
    }

    const { [dottedName]: _, ...rest } = currentSituation
    return rest as Situation<RuleName>
  }

  return {
    ...currentSituation,
    [dottedName]: situationValue,
  }
}

export function situationsAreEqual<RuleName extends string>(
  sit1: Situation<RuleName>,
  sit2: Situation<RuleName>,
): boolean {
  return JSON.stringify(sit1) === JSON.stringify(sit2)
}
