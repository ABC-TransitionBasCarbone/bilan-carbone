import { DatePicker, DatePickerProps } from '@mui/x-date-pickers'
import { PickerValue } from '@mui/x-date-pickers/internals/models'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { InputHTMLAttributes, useMemo } from 'react'
import { BaseInputProps } from '../types/formTypes'

dayjs.extend(customParseFormat)

const DatePickerInput = ({
  value,
  onChange,
  onBlur,
  errorMessage,
  disabled,
  ...props
}: BaseInputProps & Omit<DatePickerProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>) => {
  const handleDateChange = (newValue: PickerValue) => {
    onChange(newValue?.format('DD/MM/YYYY') || '')
  }

  const handleAccept = () => {
    if (onBlur) {
      onBlur()
    }
  }

  const convertedValue = useMemo(() => {
    if (value) {
      // Try to parse DD/MM/YYYY format first, then fallback to default parsing
      const ddmmyyyy = dayjs(value, 'DD/MM/YYYY', true)
      if (ddmmyyyy.isValid()) {
        return ddmmyyyy
      }
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

export default DatePickerInput
