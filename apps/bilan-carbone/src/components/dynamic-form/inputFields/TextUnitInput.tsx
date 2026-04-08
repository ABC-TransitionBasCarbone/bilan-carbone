import { useUnitLabel } from '@/services/unit'
import { TextFieldProps } from '@mui/material'
import classNames from 'classnames'
import { InputHTMLAttributes, useCallback, useMemo } from 'react'
import DebouncedInput from '../../base/DebouncedInput'
import { getNumberInputFormat, getTextInputFormat } from '../services/questionService'
import { BaseInputProps } from '../types/formTypes'
import { NumberInputFormat, QuestionType, TextInputFormat } from '../types/questionTypes'
import { getInputFormatConfig } from './textInputFormatConfig'
import styles from './TextUnitInput.module.css'

interface TextUnitInputProps extends BaseInputProps {
  format?: TextInputFormat | NumberInputFormat
  unit?: string | null
}

const TextUnitInput = ({
  question,
  value,
  onChange,
  disabled,
  format,
  unit,
  errorMessage,
  label,
  ...props
}: TextUnitInputProps &
  Omit<TextFieldProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>) => {
  const getUnitLabel = useUnitLabel()
  const questionFormat =
    format ||
    (question.type === QuestionType.NUMBER || question.type === QuestionType.POSTAL_CODE
      ? getNumberInputFormat(question.type)
      : getTextInputFormat(question.type))
  const questionUnit = unit || question.unit

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue)
    },
    [onChange],
  )

  const inputProps: Record<string, unknown> = useMemo(() => {
    const config = getInputFormatConfig(questionFormat)
    return { ...config.inputProps }
  }, [questionFormat])

  return (
    <div className={classNames(styles.inputWithUnit, 'flex grow')}>
      <DebouncedInput
        {...props}
        label={label}
        error={!!errorMessage}
        helperText={errorMessage}
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        debounce={300}
        sx={{
          minWidth: '6.5rem',
        }}
        slotProps={{
          htmlInput: inputProps,
          input: {
            onWheel: (event) => (event.target as HTMLInputElement).blur(),
          },
          inputLabel: {
            shrink: true,
          },
        }}
      />
      {questionUnit && <div className={styles.unit}>{getUnitLabel(questionUnit, Number(value))}</div>}
    </div>
  )
}

export default TextUnitInput
