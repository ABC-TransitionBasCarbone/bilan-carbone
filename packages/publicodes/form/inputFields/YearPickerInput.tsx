import { DatePicker } from '@mui/x-date-pickers'
import { PickerValue } from '@mui/x-date-pickers/internals/models'
import { EvaluatedStringInput } from '@publicodes/forms'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useCallback, useMemo } from 'react'

dayjs.extend(customParseFormat)

interface YearPickerInputProps<RuleName extends string = string> {
  formElement: EvaluatedStringInput<RuleName>
  onChange: (rule: RuleName, value: string) => void
}

const YearPickerInput = <RuleName extends string = string>({
  formElement,
  onChange,
}: YearPickerInputProps<RuleName>) => {
  const handleYearChange = useCallback(
    (newValue: PickerValue) => {
      if (newValue && newValue.isValid()) {
        const formattedValue = newValue.format('YYYY')
        onChange(formElement.id, formattedValue + '-01-01')
      }
    },
    [onChange, formElement.id],
  )

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
      label={''}
      value={convertedValue}
      onChange={handleYearChange}
      disabled={formElement.applicable === false}
      views={['year']}
      openTo="year"
      slotProps={{
        textField: {
          sx: {
            backgroundColor: 'white',
            width: '6.5rem',
            borderRadius: '0.5rem',
          },
        },
      }}
    />
  )
}

export default YearPickerInput
