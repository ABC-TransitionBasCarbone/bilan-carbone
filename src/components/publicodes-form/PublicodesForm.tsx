import { Box } from '@mui/material'
import { FormBuilder, FormState } from '@publicodes/forms'
import { Situation } from 'publicodes'
import { useCallback, useMemo, useState } from 'react'
import PublicodesQuestion from './PublicodesQuestion'

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
    const initial = FormBuilder.newState(initialSituation)
    return formBuilder.start(initial, ...targetRules)
  })

  // NOTE: for now, if we want to mimic the previous behavior, we don't need
  // to manage pagination, but it could be added later if we need a realy
  // generic form component.
  const currentPage = useMemo(() => {
    return formBuilder.currentPage(formState)
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

  console.log('currentPage', currentPage)
  console.log('formState', formState)

  return (
    <Box className="dynamic-form">
      <Box>
        {/* TODO: the relation lines between questions */}
        {currentPage.elements.map((formLayout, index) => {
          // Generate a unique key based on the layout type
          const key =
            formLayout.type === 'simple' ? formLayout.evaluatedElement.id : `table-${formLayout.title}-${index}`
          return <PublicodesQuestion key={key} formLayout={formLayout} onChange={handleFieldChange} />
        })}
      </Box>
    </Box>
  )
}
