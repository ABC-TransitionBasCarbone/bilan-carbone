import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'

dayjs.extend(customParseFormat)

interface YearPickerProps<T extends FieldValues, RuleName extends string = string> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  handleChange: (value: string) => void
}

const YearPicker = <T extends FieldValues, RuleName extends string = string>({
  label,
  control,
  name,
  handleChange
}: YearPickerProps<T, RuleName>) => {
  return (<Controller
    control={control}
    name={name}
    render={({ field: { onChange, value } }) => (
    <DatePicker
      label={label ?? ''}
      value={value ? dayjs(value, 'YYYY') : null}
      onChange={(value) => {
        onChange(value)
        if (value && dayjs(value).isValid()) {
          handleChange(dayjs(value, 'YYYY').year().toString())
        }
      }}
      views={['year']}
      openTo="year"
    />)}
  />)
}

export default YearPicker
