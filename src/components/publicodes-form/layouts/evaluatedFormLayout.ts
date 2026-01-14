import { EvaluatedFormElement, getEvaluatedFormElement } from '@publicodes/forms'
import Engine from 'publicodes'
import { FormLayout, GroupLayout, InputLayout, TableLayout } from './formLayout'

export type EvaluatedFormLayout<RuleName extends string> =
  | EvaluatedInputLayout<RuleName>
  | EvaluatedGroupLayout<RuleName>
  | EvaluatedTableLayout<RuleName>

export type EvaluatedInputLayout<RuleName extends string> = InputLayout<RuleName> & {
  evaluatedElement: EvaluatedFormElement<RuleName>
}

export type EvaluatedGroupLayout<RuleName extends string> = GroupLayout<RuleName> & {
  evaluatedElements: Array<EvaluatedFormElement<RuleName>>
}

export type EvaluatedTableLayout<RuleName extends string> = TableLayout<RuleName> & {
  evaluatedRows: Array<Array<EvaluatedFormElement<RuleName>>>
}

export function getEvaluatedFormLayout<RuleName extends string>(
  engine: Engine<RuleName>,
  layout: FormLayout<RuleName>,
): EvaluatedFormLayout<RuleName> {
  const evaluateRule = (rule: RuleName) => getEvaluatedFormElement(engine, rule)

  switch (layout.type) {
    case 'input':
      return { ...layout, evaluatedElement: evaluateRule(layout.rule) }
    case 'group':
      return {
        ...layout,
        evaluatedElements: layout.rules.map((rule) => evaluateRule(rule)),
      }
    case 'table':
      return {
        ...layout,
        evaluatedRows: layout.rows.map((row) => row.map((rule) => evaluateRule(rule))),
      }
  }
}
