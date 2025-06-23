import { DatePicker, DatePickerProps } from '@mui/x-date-pickers'
import { PickerValue } from '@mui/x-date-pickers/internals/models'
import dayjs from 'dayjs'
import { InputHTMLAttributes, useMemo } from 'react'
import { BaseInputProps } from '../types/formTypes'

const YearPickerInput = ({
  value,
  onChange,
  onBlur,
  errorMessage,
  disabled,
  ...props
}: BaseInputProps & Omit<DatePickerProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>) => {
  const handleYearChange = (newValue: PickerValue) => {
    onChange(newValue?.format('YYYY') || '')
  }

  const handleAccept = () => {
    if (onBlur) {
      onBlur()
    }
  }

  const convertedValue = useMemo(() => {
    if (value && typeof value === 'string') {
      // If it's just a year string, create a date from it
      const year = parseInt(value, 10)
      if (!isNaN(year) && year >= 1900 && year <= 2100) {
        return dayjs().year(year)
      }
    }
    return null
  }, [value])

  return (
    <DatePicker
      {...props}
      label={''}
      value={convertedValue}
      onChange={handleYearChange}
      onAccept={handleAccept}
      disabled={disabled}
      views={['year']}
      openTo="year"
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

export default YearPickerInput
