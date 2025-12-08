import { Box } from '@mui/material'
import Engine, { Situation } from 'publicodes'
import { useCallback, useMemo } from 'react'
import { getEvaluatedFormLayout } from './layouts/evaluatedFormLayout'
import { FormLayout } from './layouts/formLayout'
import PublicodesQuestion from './PublicodesQuestion'
import styles from './styles/DynamicForm.module.css'
import {
  areRulesReferencedInApplicability,
  evaluatedLayoutIsApplicable,
  getRuleNamesFromLayout,
  getUpdatedSituationWithInputValue,
} from './utils'

export interface PublicodesFormProps<RuleName extends string, S extends Situation<RuleName>> {
  engine: Engine<RuleName>
  formLayouts: FormLayout<RuleName>[]
  situation: S
  setSituation: (situation: S) => void
}

/**
 * A generic form component that dynamically generates form fields based on a
 * Publicodes {@link FormBuilder} and a set of target rules.
 *
 * The target rules are the Publicodes rules that the form aims to evaluate.
 * The form will display the necessary questions to determine the values of
 * these rules based on the provided initial situation and then dynamically
 * update as the user interacts with the form.
 */
export default function PublicodesForm<RuleName extends string, S extends Situation<RuleName>>({
  engine,
  formLayouts,
  situation,
  setSituation,
}: PublicodesFormProps<RuleName, S>) {
  const elementsWithRelation = useMemo(() => {
    // FIXME: should manage multiple questions linked to previous ones.
    return formLayouts.map((formLayout, index) => {
      const evaluatedFormLayout = getEvaluatedFormLayout(engine, formLayout, situation)
      const currentRuleNames = getRuleNamesFromLayout(formLayout)
      const previousRuleNames = index > 0 ? getRuleNamesFromLayout(formLayouts[index - 1]) : undefined
      const isLinkedToPreviousQuestion =
        currentRuleNames &&
        previousRuleNames &&
        areRulesReferencedInApplicability((rule: RuleName) => engine.getRule(rule), currentRuleNames, previousRuleNames)

      const key =
        formLayout.type === 'simple'
          ? formLayout.rule
          : formLayout.type === 'group'
            ? `group-${index}`
            : `table-${formLayout.title}-${index}`

      const isApplicable = evaluatedLayoutIsApplicable(evaluatedFormLayout)
      return { evaluatedFormLayout, isLinkedToPreviousQuestion, key, isApplicable }
    })
  }, [formLayouts, engine, situation])

  const handleFieldChange = useCallback(
    (ruleName: RuleName, value: string | number | boolean | undefined) => {
      const newSituation = getUpdatedSituationWithInputValue(engine, situation, ruleName, value)
      engine.setSituation(newSituation)
      setSituation(newSituation as S)
    },
    [engine, situation, setSituation],
  )

  return (
    <Box className="dynamic-form">
      <Box>
        {elementsWithRelation.map(({ key, evaluatedFormLayout, isApplicable, isLinkedToPreviousQuestion }) => {
          return isApplicable ? (
            <Box key={key}>
              {isLinkedToPreviousQuestion && <Box className={styles.relationLine} />}
              <PublicodesQuestion formLayout={evaluatedFormLayout} onChange={handleFieldChange} />
            </Box>
          ) : null
        })}
      </Box>
    </Box>
  )
}
