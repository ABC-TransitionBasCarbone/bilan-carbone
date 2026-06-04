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
}

const NumberWithUnitInput = <RuleName extends string>({
  formElement,
  onChange,
  disabled,
}: NumberWithUnitInputProps<RuleName>) => {
  const unit = usePublicodesUnitTranslation(formElement.unit)
  const isDisabled = disabled || !formElement.applicable
  const { localValue, handleValueChange, handleValueCommitted, handleFocus } = useSimpleInputState<number>(
    formElement,
    onChange as OnFieldChange,
  )

  return (
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
  )
}

export default NumberWithUnitInput
