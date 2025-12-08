import { EvaluatedFormElement, getEvaluatedFormElement } from '@publicodes/forms'
import Engine, { Situation } from 'publicodes'
import { FormLayout, GroupLayout, SimpleLayout, TableLayout } from './formLayout'

export type EvaluatedFormLayout<RuleName extends string> =
  | EvaluatedSimpleLayout<RuleName>
  | EvaluatedGroupLayout<RuleName>
  | EvaluatedTableLayout<RuleName>

export type EvaluatedSimpleLayout<RuleName extends string> = SimpleLayout<RuleName> & {
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
  situation: Situation<RuleName>,
): EvaluatedFormLayout<RuleName> {
  switch (layout.type) {
    case 'simple':
      return { ...layout, evaluatedElement: getEvaluatedFormElement(engine, layout.rule, situation) }
    case 'group':
      return {
        ...layout,
        evaluatedElements: layout.rules.map((rule) => getEvaluatedFormElement(engine, rule, situation)),
      }
    case 'table':
      return {
        ...layout,
        evaluatedRows: layout.rows.map((row) => row.map((rule) => getEvaluatedFormElement(engine, rule, situation))),
      }
  }
}
