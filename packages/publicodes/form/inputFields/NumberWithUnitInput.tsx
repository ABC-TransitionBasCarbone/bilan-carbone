import { usePublicodesUnitTranslation } from '@abc-transitionbascarbone/publicodes/hooks'
import { NumberField } from '@base-ui-components/react/number-field'
import { InputAdornment, OutlinedInput } from '@mui/material'
import { EvaluatedNumberInput } from '@publicodes/forms'
import classNames from 'classnames'
import { SuggestionChipOption, SuggestionChips } from '../SuggestionChips'
import { OnFieldChange, getNumericSuggestionEntries } from '../utils'
import { useSimpleInputState } from './hooks/useSimpleInputState'
import styles from './NumberWithUnitInput.module.css'
import { BaseInputProps } from './utils'

interface NumberWithUnitInputProps<RuleName extends string> extends BaseInputProps<RuleName> {
  formElement: EvaluatedNumberInput<RuleName>
  suggestions?: Record<string, string | number | Record<string, unknown>> | undefined
  isFilteringQuestion?: boolean
}

const NumberWithUnitInput = <RuleName extends string>({
  formElement,
  onChange,
  suggestions,
  isFilteringQuestion = false,
}: NumberWithUnitInputProps<RuleName>) => {
  const unit = usePublicodesUnitTranslation(formElement.unit)
  const { localValue, handleValueChange, handleValueCommitted, handleFocus } = useSimpleInputState<number>(
    formElement,
    onChange as OnFieldChange,
  )

  const suggestionEntries: SuggestionChipOption<number>[] = getNumericSuggestionEntries(suggestions).map((suggestion) => ({
    label: suggestion.label,
    value: suggestion.value,
  }))
  const hasSuggestions = suggestionEntries.length > 0
  const isLockedSuggestion = hasSuggestions && isFilteringQuestion

  return (
    <div>
      {hasSuggestions && (
        <SuggestionChips
          ruleName={formElement.id}
          suggestions={suggestionEntries}
          isSelected={(suggestion) => localValue === suggestion.value}
          onSelect={(value) => {
            handleValueChange(value)
            handleValueCommitted(value)
          }}
        />
      )}
      {!isLockedSuggestion && (
        <NumberField.Root
          className={classNames(styles.inputWrapper, 'wfit')}
          value={localValue}
          onFocus={handleFocus}
          onValueChange={handleValueChange}
          onValueCommitted={handleValueCommitted}
        >
          <NumberField.Input
            className={styles.input}
            inputMode="decimal"
            render={
              <OutlinedInput
                endAdornment={unit ? <InputAdornment position="end">{unit}</InputAdornment> : undefined}
              />
            }
          />
        </NumberField.Root>
      )}
    </div>
  )
}

export default NumberWithUnitInput
