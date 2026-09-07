import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Controller } from 'react-hook-form'

dayjs.extend(customParseFormat)

interface YearPickerProps<RuleName extends string = string> {
  control: any
  label?: string
  handleChange: (value: string) => void
}

const YearPicker = <RuleName extends string = string>({
  label,
  control,
  handleChange
}: YearPickerProps<RuleName>) => {
  return (<Controller
    control={control}
    name="studyDate"
    render={({ field: { onChange, value } }) => (
    <DatePicker
      label={label ?? ''}
      value={dayjs(value).set('month', 0).set('date', 1)}
      onChange={(newValue) => {
        onChange(newValue)
        if (newValue?.isValid) {
          const formattedNewValue = dayjs(newValue).set('month', 0).set('date', 1)
          handleChange(formattedNewValue.toISOString())
        }
      }}
      views={['year']}
      openTo="year"
    />)}
  />)
}

export default YearPicker
