import { NumberField } from '@base-ui-components/react/number-field'
import { InputAdornment, OutlinedInput } from '@mui/material'
import { EvaluatedNumberInput } from '@publicodes/forms'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './NumberWithUnitInput.module.css'
import { BaseInputProps } from './utils'

interface NumberWithUnitInputProps<RuleName extends string> extends BaseInputProps<RuleName> {
  formElement: EvaluatedNumberInput<RuleName>
}

const NumberWithUnitInput = <RuleName extends string>({
  formElement,
  onChange,
  disabled,
}: NumberWithUnitInputProps<RuleName>) => {
  const questionUnit = formElement.unit
  const committedValue = formElement.value ?? formElement.defaultValue ?? null
  const isDisabled = disabled || !formElement.applicable

  const [localValue, setLocalValue] = useState<number | null>(committedValue)
  const previousCommittedValue = useRef(committedValue)
  const uncommittedValue = useRef<number | null>(null)
  const hasUncommittedChanges = useRef(false)

  // Keep a ref to onChange for use in cleanup
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Keep a ref to formElement.id for use in cleanup
  const formElementIdRef = useRef(formElement.id)
  formElementIdRef.current = formElement.id

  // Sync local value when the committed value changes from outside (e.g., from DB sync)
  useEffect(() => {
    // Only sync if the value changed externally AND differs from local value
    // This prevents overwriting user input during rapid typing
    if (previousCommittedValue.current !== committedValue && committedValue !== localValue) {
      setLocalValue(committedValue)
    }
    previousCommittedValue.current = committedValue
  }, [committedValue, localValue])

  // Flush uncommitted changes on unmount
  useEffect(() => {
    return () => {
      if (hasUncommittedChanges.current) {
        onChangeRef.current(formElementIdRef.current, String(uncommittedValue.current ?? ''))
      }
    }
  }, [])

  const handleValueChange = useCallback((newValue: number | null) => {
    setLocalValue(newValue)
    uncommittedValue.current = newValue
    hasUncommittedChanges.current = true
  }, [])

  const handleValueCommitted = useCallback(
    (newValue: number | null) => {
      hasUncommittedChanges.current = false
      uncommittedValue.current = null
      onChange(formElement.id, String(newValue ?? ''))
    },
    [onChange, formElement.id],
  )

  return (
    <NumberField.Root
      className={styles.inputWrapper}
      value={localValue}
      onValueChange={handleValueChange}
      onValueCommitted={handleValueCommitted}
      disabled={isDisabled}
    >
      <NumberField.Input
        className={styles.input}
        render={
          <OutlinedInput
            endAdornment={questionUnit ? <InputAdornment position="end">{questionUnit}</InputAdornment> : undefined}
          />
        }
      />
    </NumberField.Root>
  )
}

export default NumberWithUnitInput
