'use client'

import { Box } from '@mui/material'
import { FormBuilder, FormState } from '@publicodes/forms'
import Engine, { Situation } from 'publicodes'
import { useCallback, useMemo, useState } from 'react'

export interface PublicodesFormProps<RuleName extends string, S extends Situation<RuleName>> {
  /** The Publicodes engine instanciated with the relevant rules. */
  engine: Engine<RuleName>
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

export default function PublicodesForm<RuleName extends string, S extends Situation<RuleName>>({
  engine,
  targetRules,
  initialSituation = {} as S,
  onFieldChange,
}: PublicodesFormProps<RuleName, S>) {
  const formBuilder = useMemo(() => {
    return new FormBuilder({ engine })
  }, [engine])

  const [formState, setFormState] = useState<FormState<RuleName>>(() => {
    const initial = FormBuilder.newState(initialSituation)
    return formBuilder.start(initial, ...targetRules)
  })

  // NOTE: for now, if we want to mimic the previous behavior, we don't need
  // to manage pagination, but it could be added later if we need a realy
  // generic form component.
  const currentPage = useMemo(() => formBuilder.currentPage(formState), [formBuilder, formState])

  const handleFieldChange = useCallback(
    (fieldName: RuleName, value: string | number | boolean | undefined) => {
      setFormState((currentState) => {
        const newState = formBuilder.handleInputChange(currentState, fieldName, value)
        onFieldChange?.(fieldName, value, newState)
        return newState
      })
    },
    [formBuilder, onFieldChange],
  )

  return (
    <Box className="dynamic-form">
      <Box>
        {currentPage.elements.map((element) => (
          <Box key={element.id} sx={{ mb: 2 }}>
            {/* TODO: manage inputs */}
            <pre>{JSON.stringify(element, null, 2)}</pre>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
