import { DatePicker, DatePickerProps } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'

dayjs.extend(utc)

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  translation: (slug: string) => string
  ['data-testid']?: string
  clearable?: boolean
}

export const FormDatePicker = <T extends FieldValues>({
  name,
  control,
  translation,
  'data-testid': dataTestId,
  clearable = false,
  ...datePickerProps
}: Props<T> & DatePickerProps<true>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <DatePicker
          {...datePickerProps}
          slotProps={{
            textField: {
              helperText: error && error.message ? translation('validation.' + error.message) : null,
              error: !!error,
              //@ts-expect-error: Missing in MUI Props
              'data-testid': dataTestId,
            },
            field: { clearable },
          }}
          onChange={(date) => {
            if (date && date.isValid()) {
              onChange(date.utc(true).format())
            } else if (date == null && clearable) {
              onChange(null)
            }
          }}
          value={value ? dayjs(value) : null}
        />
      )}
    />
  )
}
