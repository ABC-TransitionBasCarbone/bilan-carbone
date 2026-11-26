import { getNumericSuggestionEntries } from '@abc-transitionbascarbone/common/publicodes/form/suggestions'
import { OnFieldChange } from '@abc-transitionbascarbone/common/publicodes/form/utils'
import { usePublicodesUnitTranslation } from '@abc-transitionbascarbone/common/publicodes/hooks'
import { isHighlightedUnit } from '@abc-transitionbascarbone/common/utils/unit'
import { NumberField } from '@base-ui-components/react/number-field'
import { InputAdornment, OutlinedInput } from '@mui/material'
import { EvaluatedNumberInput } from '@publicodes/forms'
import classNames from 'classnames'
import { useHighlightedUnits } from '../HighlightedUnitsProvider'
import { SuggestionChipOption, SuggestionChips } from '../SuggestionChips'
import { useSimpleInputState } from './hooks/useSimpleInputState'
import styles from './NumberWithUnitInput.module.css'
import { BaseInputProps } from './utils'

interface NumberWithUnitInputProps<RuleName extends string> extends BaseInputProps<RuleName> {
  formElement: EvaluatedNumberInput<RuleName>
  suggestions?: Record<string, string | number | Record<string, unknown>> | undefined
  isFilteringQuestion?: boolean
  defaultAsPlaceholder?: boolean
}

const NumberWithUnitInput = <RuleName extends string>({
  formElement,
  onChange,
  suggestions,
  isFilteringQuestion = false,
  defaultAsPlaceholder = false,
}: NumberWithUnitInputProps<RuleName>) => {
  const unit = usePublicodesUnitTranslation(formElement.unit)
  const highlightedUnits = useHighlightedUnits()
  const { localValue, handleValueChange, handleValueCommitted, handleFocus } = useSimpleInputState<number>(
    formElement,
    onChange as OnFieldChange,
    defaultAsPlaceholder,
  )

  const suggestionEntries: SuggestionChipOption<number>[] = getNumericSuggestionEntries(suggestions)
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
                placeholder={defaultAsPlaceholder ? String(formElement.defaultValue ?? '') : undefined}
                endAdornment={
                  unit ? (
                    <InputAdornment
                      position="end"
                      className={classNames({
                        [styles.highlightedUnit]: isHighlightedUnit(formElement.unit, highlightedUnits),
                      })}
                    >
                      {unit}
                    </InputAdornment>
                  ) : undefined
                }
              />
            }
          />
        </NumberField.Root>
      )}
    </div>
  )
}

export default NumberWithUnitInput
