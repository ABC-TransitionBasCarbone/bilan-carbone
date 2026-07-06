import { usePublicodesUnitTranslation } from '@abc-transitionbascarbone/publicodes/hooks'
import { NumberField } from '@base-ui-components/react/number-field'
import { InputAdornment, OutlinedInput } from '@mui/material'
import { EvaluatedNumberInput } from '@publicodes/forms'
import { OnFieldChange } from '../utils'
import { useSimpleInputState } from './hooks/useSimpleInputState'
import styles from './NumberWithUnitInput.module.css'
import { BaseInputProps } from './utils'

interface NumberWithUnitInputProps<RuleName extends string> extends BaseInputProps<RuleName> {
  formElement: EvaluatedNumberInput<RuleName>
  suggestions?: Record<string, number>
}

const NumberWithUnitInput = <RuleName extends string>({
  formElement,
  onChange,
  disabled,
  suggestions,
}: NumberWithUnitInputProps<RuleName>) => {
  const unit = usePublicodesUnitTranslation(formElement.unit)
  const isDisabled = disabled || !formElement.applicable
  const { localValue, handleValueChange, handleValueCommitted, handleFocus } = useSimpleInputState<number>(
    formElement,
    onChange as OnFieldChange,
  )

  const suggestionEntries = suggestions ? Object.entries(suggestions) : []

  return (
    <div>
      <NumberField.Root
        className={styles.inputWrapper}
        value={localValue}
        onFocus={handleFocus}
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
      {suggestionEntries.length > 0 && (
        <div className={styles.suggestions}>
          {suggestionEntries.map(([label, value]) => (
            <button
              key={label}
              type="button"
              className={styles.suggestionChip}
              onClick={() => {
                handleValueChange(value)
                handleValueCommitted(value)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default NumberWithUnitInput
