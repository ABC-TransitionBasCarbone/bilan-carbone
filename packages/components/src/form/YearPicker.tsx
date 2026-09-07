import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

interface YearPickerProps<RuleName extends string = string> {
  value: string
  label?: string
  disabled?: boolean
  onChange: (value: string) => void
}

const YearPicker = <RuleName extends string = string>({
  value,
  label,
  disabled,
  onChange
}: YearPickerProps<RuleName>) => {
  return (
    <DatePicker
      label={label ?? ''}
      value={dayjs(value).set('month', 0).set('date', 1)}
      onChange={(newValue) => onChange(newValue?.format('YYYY') ?? '')}
      disabled={disabled}
      views={['year']}
      openTo="year"
    />
  )
}

export default YearPicker
