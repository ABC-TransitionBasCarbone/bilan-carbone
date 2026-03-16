import { OutlinedInput, TextField } from '@mui/material'
import { EvaluatedStringInput } from '@publicodes/forms'
import { OnFieldChange } from '../utils'
import { useSimpleInputState } from './hooks/useSimpleInputState'
import styles from './NumberWithUnitInput.module.css'
import { BaseInputProps } from './utils'

interface TextInputProps<RuleName extends string> extends BaseInputProps<RuleName> {
  formElement: EvaluatedStringInput<RuleName>
}

const TextInput = <RuleName extends string>({ formElement, onChange, disabled }: TextInputProps<RuleName>) => {
  const isDisabled = disabled || !formElement.applicable
  const { localValue, handleValueChange, handleValueCommitted, handleFocus } = useSimpleInputState<string>(
    formElement,
    onChange as OnFieldChange,
  )

  return (
    <TextField
      className={styles.inputWrapper}
      value={localValue}
      onFocus={handleFocus}
      onChange={(event) => {
        handleValueChange(event.target.value === '' ? null : event.target.value)
      }}
      onBlur={(event) => {
        handleValueCommitted(event.target.value === '' ? null : event.target.value)
      }}
      disabled={isDisabled}
    >
      <OutlinedInput className={styles.input} />
    </TextField>
  )
}

export default TextInput
