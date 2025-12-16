import { DatePicker, DatePickerProps } from '@mui/x-date-pickers'
import { PickerValue } from '@mui/x-date-pickers/internals/models'
import { EvaluatedStringInput } from '@publicodes/forms'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { InputHTMLAttributes, useCallback, useMemo } from 'react'
import { BaseInputProps } from './utils'

dayjs.extend(customParseFormat)

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
  const handleYearChange = useCallback(
    (newValue: PickerValue) => {
      if (newValue && newValue.isValid()) {
        const formattedValue = newValue.format('YYYY')
        onChange(formElement.id, formattedValue + '-01-01')
      }
    },
    [onChange, formElement.id],
  )

  const handleAccept = () => {
    if (onBlur) {
      onBlur()
    }
  }

  const convertedValue = useMemo(() => {
    const val = formElement.value ?? formElement.defaultValue
    if (val && typeof val === 'string') {
      // DD/MM/YYYY (Publicodes date format)
      const parsed = dayjs(val, 'DD/MM/YYYY', true)
      if (parsed.isValid()) {
        const year = parsed.year()
        if (year >= 1900 && year <= 2100) {
          return dayjs().year(year)
        }
      }
    }
    return null
  }, [formElement.value, formElement.defaultValue])

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
