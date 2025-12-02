import { Box } from '@mui/material'
import { FormBuilder, FormState } from '@publicodes/forms'
import Engine, { Situation } from 'publicodes'
import { useCallback, useMemo, useState } from 'react'
import PublicodesQuestion from './PublicodesQuestion'
import styles from './styles/DynamicForm.module.css'
import { evaluatedLayoutIsApplicable, getRuleNameFromLayout, isRuleReferencedInApplicability } from './utils'

export interface PublicodesFormProps<RuleName extends string, S extends Situation<RuleName>> {
  /** The form builder used to generate the form pages and handle input changes. */
  formBuilder: FormBuilder<RuleName>
  /** The rules to be evaluated by the Publicodes engine which determines the questions to display. */
  targetRules: RuleName[]
  /** The initial situation to pre-fill the form and determine the visibility of questions. */
  initialSituation?: S
  /** Callback invoked whenever a form field changes. */
  onFieldChange?: (
    fieldName: RuleName,
    value: string | number | boolean | undefined,
    newState: FormState<RuleName>,
  ) => void
}

/**
 * A generic form component that dynamically generates form fields based on a
 * Publicodes {@link Engine} and a set of target rules.
 *
 * The target rules are the Publicodes rules that the form aims to evaluate.
 * The form will display the necessary questions to determine the values of
 * these rules based on the provided initial situation and then dynamically
 * update as the user interacts with the form.
 */
export default function PublicodesForm<RuleName extends string, S extends Situation<RuleName>>({
  targetRules,
  formBuilder,
  initialSituation = {} as S,
  onFieldChange,
}: PublicodesFormProps<RuleName, S>) {
  const [formState, setFormState] = useState<FormState<RuleName>>(() => {
    const initialState = FormBuilder.newState(initialSituation)
    return formBuilder.start(initialState, ...targetRules)
  })

  // NOTE: for now, if we want to mimic the previous behavior, we don't need
  // to manage pagination, but it could be added later if we need a realy
  // generic form component.
  const elementsWithRelation = useMemo(() => {
    const { elements } = formBuilder.currentPage(formState)
    return elements.map((formLayout, index) => {
      const currentRuleName = getRuleNameFromLayout(formLayout)
      const previousRuleName = index > 0 ? getRuleNameFromLayout(elements[index - 1]) : undefined
      const isLinkedToPreviousQuestion =
        currentRuleName &&
        previousRuleName &&
        isRuleReferencedInApplicability(
          (rule: RuleName) => formBuilder.getRule(formState, rule),
          currentRuleName,
          previousRuleName,
        )

      const key =
        formLayout.type === 'simple'
          ? formLayout.evaluatedElement.id
          : formLayout.type === 'group'
            ? `group-${index}`
            : `table-${formLayout.title}-${index}`

      const isApplicable = evaluatedLayoutIsApplicable(formLayout)
      return { formLayout, isLinkedToPreviousQuestion, key, isApplicable }
    })
  }, [formBuilder, formState])

  const handleFieldChange = useCallback(
    (ruleName: RuleName, value: string | number | boolean | undefined) => {
      setFormState((currentState) => {
        const newState = formBuilder.handleInputChange(currentState, ruleName, value)
        onFieldChange?.(ruleName, value, newState)
        return newState
      })
    },
    [formBuilder, onFieldChange],
  )

  return (
    <Box className="dynamic-form">
      <Box>
        {elementsWithRelation.map(({ key, formLayout, isApplicable, isLinkedToPreviousQuestion }) => {
          return isApplicable ? (
            <Box key={key}>
              {isLinkedToPreviousQuestion && <Box className={styles.relationLine} />}
              <PublicodesQuestion formLayout={formLayout} onChange={handleFieldChange} />
            </Box>
          ) : null
        })}
      </Box>
    </Box>
  )
}
