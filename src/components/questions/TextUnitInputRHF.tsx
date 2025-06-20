import { TextFieldProps } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { InputHTMLAttributes, KeyboardEvent, useCallback, useMemo } from 'react'
import DebouncedInput from '../base/DebouncedInput'
import { BaseInputProps } from '../dynamic-form/types/formTypes'
import { InputFormat, QuestionType } from '../dynamic-form/types/questionTypes'
import styles from './TextUnitInput.module.css'

interface TextUnitInputRHFProps extends BaseInputProps {
  label?: string
  format?: InputFormat
  unit?: string | null
}

const TextUnitInputRHF = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  label,
  format,
  unit,
  ...props
}: TextUnitInputRHFProps &
  Omit<TextFieldProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>) => {
  const tUnits = useTranslations('units')
  const tQuestions = useTranslations('emissionFactors.post.cutQuestions')

  const questionFormat = format || question.format || InputFormat.Text
  const questionUnit = unit || question.unite
  const inputLabel = label || tQuestions(`format.${questionFormat}`)

  // Handle value conversion for number inputs
  const handleChange = useCallback(
    (newValue: unknown) => {
      if (question.type === QuestionType.NUMBER || questionFormat === InputFormat.Number) {
        // Convert string to number for number inputs
        const stringValue = String(newValue || '')
        if (stringValue === '') {
          onChange(undefined)
        } else {
          const numericValue = parseFloat(stringValue)
          onChange(isNaN(numericValue) ? undefined : numericValue)
        }
      } else {
        onChange(newValue)
      }
    },
    [onChange, question.type, questionFormat],
  )

  // Convert number value back to string for display
  const displayValue = useMemo(() => {
    if (value === null || value === undefined) {
      return ''
    }
    if (question.type === QuestionType.NUMBER || questionFormat === InputFormat.Number) {
      return String(value)
    }
    return String(value)
  }, [value, question.type, questionFormat])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const isControlKey = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', '.', ','].includes(e.key)
      const isDigit = /^\d$/.test(e.key)

      switch (questionFormat) {
        case InputFormat.Year:
        case InputFormat.PostalCode:
          if (!isDigit && !isControlKey) {
            e.preventDefault()
          }
          break
        case InputFormat.Number:
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
    switch (questionFormat) {
      case InputFormat.PostalCode:
        return {
          inputMode: 'numeric' as const,
          maxLength: 5,
          pattern: '[0-9]{5}',
          onKeyDown: handleKeyDown,
        }
      case InputFormat.Year:
        return {
          inputMode: 'numeric' as const,
          maxLength: 4,
          pattern: '[0-9]{4}',
          onKeyDown: handleKeyDown,
        }
      case InputFormat.Number:
        return {
          type: 'number',
          inputMode: 'numeric' as const,
          onKeyDown: handleKeyDown,
          step: 'any',
        }
      case InputFormat.Email:
        return {
          type: 'email',
        }
      case InputFormat.Phone:
        return {
          type: 'tel',
        }
      default:
        return {}
    }
  }, [questionFormat, handleKeyDown])

  return (
    <div className={classNames(styles.inputWithUnit, 'flex grow')}>
      <DebouncedInput
        {...props}
        error={!!error}
        helperText={error}
        value={displayValue}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        debounce={50}
        slotProps={{
          htmlInput: inputProps,
          input: {
            onWheel: (event) => (event.target as HTMLInputElement).blur(),
          },
          inputLabel: {
            shrink: true,
          },
        }}
        label={inputLabel}
      />
      {questionUnit && <div className={styles.unit}>{tUnits(questionUnit)}</div>}
    </div>
  )
}

export default TextUnitInputRHF
