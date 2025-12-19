import { NumberField } from '@base-ui-components/react/number-field'
import { InputAdornment, OutlinedInput } from '@mui/material'
import { EvaluatedNumberInput } from '@publicodes/forms'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
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
  const tInput = useTranslations('publicodes-rules')
  const unitTranslationKey = `${formElement.id.replace(/\s+.\s+/g, '.')}.unité`

  const questionUnit = tInput.has(unitTranslationKey) ? tInput(unitTranslationKey) : undefined

  const value = formElement.value ?? formElement.defaultValue ?? null
  const isDisabled = disabled || !formElement.applicable

  const handleValueCommitted = useCallback(
    (newValue: number | null) => {
      onChange(formElement.id, String(newValue ?? ''))
    },
    [onChange, formElement.id],
  )

  return (
    <NumberField.Root
      className={styles.inputWrapper}
      value={value}
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
