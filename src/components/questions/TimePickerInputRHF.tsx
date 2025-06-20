import { TimePicker, TimePickerProps } from '@mui/x-date-pickers'
import { useTranslations } from 'next-intl'
import { InputHTMLAttributes } from 'react'
import { BaseInputProps } from '../dynamic-form/types/formTypes'

interface TimePickerInputRHFProps extends BaseInputProps {
  label?: string
}

const TimePickerInputRHF = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  label,
  ...props
}: TimePickerInputRHFProps &
  Omit<TimePickerProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>) => {
  const tQuestions = useTranslations('emissionFactors.post.cutQuestions')

  const inputLabel = label || tQuestions(`format.${question.format || 'Hour'}`)

  const handleTimeChange = (newValue: any) => {
    onChange(newValue?.toString() || '')
  }

  const handleAccept = () => {
    if (onBlur) {
      onBlur()
    }
  }

  return (
    <TimePicker
      {...props}
      label={inputLabel}
      value={value || null}
      onChange={handleTimeChange}
      onAccept={handleAccept}
      disabled={disabled}
      slotProps={{
        textField: {
          error: !!error,
          helperText: error,
          onBlur: onBlur,
        },
      }}
    />
  )
}

export default TimePickerInputRHF
