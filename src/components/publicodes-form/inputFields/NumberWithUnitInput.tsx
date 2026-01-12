import { usePublicodesRuleTranslation } from '@/hooks/usePublicodesRuleTranslation'
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
  const { unit } = usePublicodesRuleTranslation(formElement.id)
  const committedValue = formElement.value ?? formElement.defaultValue ?? null
  const isDisabled = disabled || !formElement.applicable

  const [localValue, setLocalValue] = useState<number | null>(committedValue)
  const previousCommittedValue = useRef(committedValue)
  const uncommittedValue = useRef<number | null>(null)

  // Sync local value when the committed value changes from outside (e.g., from DB sync)
  useEffect(() => {
    if (previousCommittedValue.current !== committedValue && committedValue !== localValue) {
      setLocalValue(committedValue)
    }
    previousCommittedValue.current = committedValue
  }, [committedValue, localValue])

  // Flush uncommitted changes on unmount
  useEffect(() => {
    return () => {
      if (uncommittedValue.current !== null) {
        onChange(formElement.id, String(uncommittedValue.current ?? ''))
      }
    }
  }, [onChange, formElement.id])

  const handleValueChange = useCallback((newValue: number | null) => {
    setLocalValue(newValue)
    uncommittedValue.current = newValue
  }, [])

  const handleValueCommitted = useCallback(
    (newValue: number | null) => {
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
          <OutlinedInput endAdornment={unit ? <InputAdornment position="end">{unit}</InputAdornment> : undefined} />
        }
      />
    </NumberField.Root>
  )
}

export default NumberWithUnitInput
