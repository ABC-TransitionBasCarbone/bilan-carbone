import { DatePicker, DatePickerProps } from '@mui/x-date-pickers'
import { PickerValue } from '@mui/x-date-pickers/internals/models'
import { EvaluatedStringInput } from '@publicodes/forms'
import dayjs from 'dayjs'
import { InputHTMLAttributes, useCallback, useMemo } from 'react'
import { BaseInputProps } from './utils'

interface YearPickerInputProps<RuleName extends string> extends BaseInputProps<RuleName> {
  formElement: EvaluatedStringInput<RuleName>
}

const YearPickerInput = <RuleName extends string>({
  formElement,
  onChange,
  onBlur,
  errorMessage,
  disabled,
  ...props
}: YearPickerInputProps<RuleName> &
  Omit<DatePickerProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>) => {
  const value = formElement.value

  const handleYearChange = useCallback((newValue: PickerValue) => {
    if (newValue && newValue.isValid()) {
      const formattedValue = newValue.format('YYYY')
      onChange(formElement.id, '01/01/' + formattedValue)
    }
  }, [])

  const handleAccept = () => {
    if (onBlur) {
      onBlur()
    }
  }

  const convertedValue = useMemo(() => {
    if (value && typeof value === 'string') {
      const year = new Date(value).getFullYear()
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
