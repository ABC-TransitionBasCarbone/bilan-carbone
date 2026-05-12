import { EvaluatedFormElement, getEvaluatedFormElement } from '@publicodes/forms'
import Engine, { Situation } from 'publicodes'
import { ListLayoutSituations } from '../../context'
import { FormLayout, GroupLayout, InputLayout, ListLayout, TableLayout } from './formLayout'

export type EvaluatedFormLayout<RuleName extends string> =
  | EvaluatedInputLayout<RuleName>
  | EvaluatedGroupLayout<RuleName>
  | EvaluatedTableLayout<RuleName>
  | EvaluatedListLayout<RuleName>

export type EvaluatedInputLayout<RuleName extends string> = InputLayout<RuleName> & {
  evaluatedElement: EvaluatedFormElement<RuleName>
}

export type EvaluatedGroupLayout<RuleName extends string> = GroupLayout<RuleName> & {
  evaluatedElements: Array<EvaluatedFormElement<RuleName>>
}

export type EvaluatedTableLayout<RuleName extends string> = TableLayout<RuleName> & {
  evaluatedRows: Array<Array<EvaluatedFormElement<RuleName>>>
}

export type EvaluatedListLayout<RuleName extends string> = ListLayout<RuleName> & {
  evaluatedTargetElement: EvaluatedFormElement<RuleName>
  evaluatedListRows: Array<{
    id: string
    situation: Situation<RuleName>
    elements: Array<EvaluatedFormElement<RuleName>>
  }>
}

export function getEvaluatedFormLayout<RuleName extends string>(
  engine: Engine<RuleName>,
  layout: FormLayout<RuleName>,
  listLayoutSituations: ListLayoutSituations<RuleName> | undefined,
): EvaluatedFormLayout<RuleName> {
  const evaluateRule = (rule: RuleName) => getEvaluatedFormElement(engine, rule)
  const evaluateRuleWithSituation = (rule: RuleName, situation: Situation<RuleName>) => {
    // PERF: should we use a single engine copy for all evaluations and use the
    // {keepPreviousSituation: true} option?
    // Maybe use a map to reuse them for in the PublicodesFormProvider to
    // compute aggregated values?
    const globalSituation = engine.getSituation()
    const tempEngine = engine.shallowCopy()
    tempEngine.setSituation({ ...globalSituation, ...situation })
    return getEvaluatedFormElement(tempEngine, rule)
  }

  switch (layout.type) {
    case 'input':
      return { ...layout, evaluatedElement: evaluateRule(layout.rule) }
    case 'list': {
      const situations = listLayoutSituations?.[layout.targetRule] ?? []
      return {
        ...layout,
        evaluatedTargetElement: evaluateRule(layout.targetRule),
        evaluatedListRows:
          situations.map(({ id, situation }) => ({
            id,
            situation,
            elements: layout.rules.map((rule) => evaluateRuleWithSituation(rule, situation)),
          })) ?? [],
      }
    }
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
