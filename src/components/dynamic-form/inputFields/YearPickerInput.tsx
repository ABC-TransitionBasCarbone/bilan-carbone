import { DatePicker, DatePickerProps } from '@mui/x-date-pickers'
import { PickerValue } from '@mui/x-date-pickers/internals/models'
import dayjs from 'dayjs'
import { ChangeEvent, InputHTMLAttributes, useMemo } from 'react'
import { BaseInputProps } from '../types/formTypes'

const YearPickerInput = ({
  value,
  onChange,
  onBlur,
  errorMessage,
  disabled,
  ...props
}: BaseInputProps & Omit<DatePickerProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>) => {
  const handleAccept = (value: PickerValue) => {
    if (onBlur) {
      onChange(value?.format('YYYY') || '')
      onBlur()
    }
  }

  return (
    <DatePicker
      {...props}
      label={''}
      onAccept={(value: PickerValue) => handleAccept(value)}
      disabled={disabled}
      views={['year']}
      openTo="year"
      slotProps={{
        textField: {
          error: !!errorMessage,
          helperText: errorMessage,
          onBlur: onBlur,
          sx: {
            backgroundColor: 'white',
            width: '6.5rem',
          },
        },
      }}
    />
  )
}

export default YearPickerInput
