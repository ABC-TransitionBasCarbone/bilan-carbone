import { DatePicker, DatePickerProps } from '@mui/x-date-pickers'
import { PickerValue } from '@mui/x-date-pickers/internals/models'
import dayjs from 'dayjs'
import { InputHTMLAttributes, useMemo } from 'react'
import { BaseInputProps } from '../types/formTypes'

const DatePickerInputRHF = ({
  value,
  onChange,
  onBlur,
  errorMessage,
  disabled,
  ...props
}: BaseInputProps & Omit<DatePickerProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>) => {
  const handleDateChange = (newValue: PickerValue) => {
    onChange(newValue?.format('YYYY-MM-DD') || '')
  }

  const handleAccept = () => {
    if (onBlur) {
      onBlur()
    }
  }

  const convertedValue = useMemo(() => {
    if (value) {
      return dayjs(value)
    }
    return null
  }, [value])

  return (
    <DatePicker
      {...props}
      label={''}
      value={convertedValue}
      onChange={handleDateChange}
      onAccept={handleAccept}
      disabled={disabled}
      slotProps={{
        textField: {
          error: !!errorMessage,
          helperText: errorMessage,
          onBlur: onBlur,
        },
      }}
    />
  )
}

export default DatePickerInputRHF
