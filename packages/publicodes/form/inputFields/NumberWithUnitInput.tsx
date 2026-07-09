import { usePublicodesUnitTranslation } from '@abc-transitionbascarbone/publicodes/hooks'
import { NumberField } from '@base-ui-components/react/number-field'
import { InputAdornment, OutlinedInput } from '@mui/material'
import { EvaluatedNumberInput } from '@publicodes/forms'
import classNames from 'classnames'
import { OnFieldChange } from '../utils'
import { useSimpleInputState } from './hooks/useSimpleInputState'
import styles from './NumberWithUnitInput.module.css'
import { BaseInputProps } from './utils'

interface NumberWithUnitInputProps<RuleName extends string> extends BaseInputProps<RuleName> {
  formElement: EvaluatedNumberInput<RuleName>
  suggestions?: Record<string, string | number | Record<string, unknown>> | undefined
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

  const suggestionEntries = suggestions
    ?
    Object.entries(suggestions).filter((entry): entry is [string, number] => typeof entry[1] === 'number')
    : []

  return (
    <div>
      {suggestionEntries.length > 0 && (
        <div className={classNames('flex', 'wrap', 'gapped-2', 'pb-2', styles.suggestions)}>
          {suggestionEntries.map(([label, value]) => (
            <button
              key={label}
              type="button"
              className={classNames(styles.suggestionChip, 'pointer')}
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
      <NumberField.Root
        className={classNames(styles.inputWrapper, 'wfit')}
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
    </div>
  )
}

export default NumberWithUnitInput
