import { TextFieldProps } from '@mui/material'
import { EvaluatedNumberInput } from '@publicodes/forms'
import classNames from 'classnames'
import { InputHTMLAttributes, useCallback, useMemo } from 'react'
import DebouncedInput from '../../base/DebouncedInput'
import styles from '../styles/TextWithUnitInput.module.css'
import { getInputFormatConfig, NumberInputFormat, TextInputFormat } from './textInputFormatConfig'
import { BaseInputProps } from './utils'

interface TextUnitInputProps<RuleName extends string> extends BaseInputProps<RuleName> {
  formElement: EvaluatedNumberInput<RuleName>
  format?: TextInputFormat | NumberInputFormat
}

// TODO: should be NumberUnitInput if only supports number inputs
const TextWithUnitInput = <RuleName extends string>({
  formElement,
  onChange,
  disabled,
  format,
  errorMessage,
  ...props
}: TextUnitInputProps<RuleName> &
  Omit<TextFieldProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>) => {
  // TODO: manage unit translation
  // const getUnitLabel = useUnitLabel()
  const questionUnit = formElement.unit
  const inputType = formElement.type
  const value = formElement.value ?? formElement.defaultValue

  const questionFormat =
    format ||
    // TODO: handle all input formats properly
    (inputType && inputType === 'number' ? NumberInputFormat.Number : TextInputFormat.Text)

  const inputProps: Record<string, unknown> = useMemo(() => {
    const config = getInputFormatConfig(questionFormat)
    return { ...config.inputProps, disabled: !formElement.applicable }
  }, [questionFormat, formElement.applicable])

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(formElement.id, newValue)
    },
    [onChange, formElement.id],
  )

  return (
    <div className={classNames(styles.inputWithUnit, 'flex grow')}>
      <DebouncedInput
        {...props}
        className={styles.input}
        // Avoid passing label to DebouncedInput to prevent double labels
        label={''}
        error={!!errorMessage}
        helperText={errorMessage}
        value={
          // TODO: check number conversion correctness
          String(value ?? '')
        }
        onChange={handleChange}
        disabled={disabled}
        debounce={300}
        slotProps={{
          htmlInput: inputProps,
          input: {
            ...inputProps,
            onWheel: (event) => (event.target as HTMLInputElement).blur(),
          },
          inputLabel: {
            shrink: true,
          },
        }}
      />
      {questionUnit && <div className={styles.unit}>{questionUnit}</div>}
    </div>
  )
}

export default TextWithUnitInput
