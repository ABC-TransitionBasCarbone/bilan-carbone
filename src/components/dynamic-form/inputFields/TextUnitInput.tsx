import { TextFieldProps } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { InputHTMLAttributes, KeyboardEvent, useCallback, useMemo } from 'react'
import DebouncedInput from '../../base/DebouncedInput'
import { getNumberInputFormat, getTextInputFormat } from '../services/questionService'
import { BaseInputProps } from '../types/formTypes'
import { NumberInputFormat, QuestionType, TextInputFormat } from '../types/questionTypes'
import { getInputFormatConfig } from './textInputFormatConfig'
import styles from './TextUnitInput.module.css'

interface TextUnitInputRHFProps extends BaseInputProps {
  format?: TextInputFormat | NumberInputFormat
  unit?: string | null
}

const TextUnitInputRHF = ({
  question,
  value,
  onChange,
  onBlur,
  disabled,
  format,
  unit,
  errorMessage,
  ...props
}: TextUnitInputRHFProps &
  Omit<TextFieldProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>) => {
  const tUnits = useTranslations('units')
  const questionFormat =
    format ||
    (question.type === QuestionType.NUMBER || question.type === QuestionType.POSTAL_CODE
      ? getNumberInputFormat(question.type)
      : getTextInputFormat(question.type))
  const questionUnit = unit || question.unite

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue)
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const isControlKey = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', '.', ','].includes(e.key)
      const isDigit = /^\d$/.test(e.key)

      switch (questionFormat) {
        case NumberInputFormat.PostalCode:
          if (!isDigit && !isControlKey) {
            e.preventDefault()
          }
          break
        case NumberInputFormat.Number:
          if (!isDigit && !isControlKey && e.key !== '-') {
            e.preventDefault()
          }
          break
        default:
          break
      }
    },
    [questionFormat],
  )

  const inputProps: Record<string, unknown> = useMemo(() => {
    const config = getInputFormatConfig(questionFormat)
    const props: Record<string, unknown> = { ...config.inputProps }

    // Add keyboard restriction for numeric inputs
    if (config.inputProps.inputMode === 'numeric') {
      props.onKeyDown = handleKeyDown
    }

    return props
  }, [questionFormat, handleKeyDown])

  return (
    <div className={classNames(styles.inputWithUnit, 'flex grow')}>
      <DebouncedInput
        {...props}
        label={''}
        error={!!errorMessage}
        helperText={errorMessage}
        value={value || ''}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        debounce={50}
        slotProps={{
          htmlInput: inputProps,
          input: {
            onWheel: (event) => (event.target as HTMLInputElement).blur(),
          },
        }}
      />
      {questionUnit && <div className={styles.unit}>{tUnits(questionUnit)}</div>}
    </div>
  )
}

export default TextUnitInputRHF
