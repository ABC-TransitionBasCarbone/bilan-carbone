import { DatePicker, DatePickerProps } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'

dayjs.extend(utc)

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  translation: (slug: string) => string
  ['data-testid']?: string
}

export const FormDatePicker = <T extends FieldValues>({
  name,
  control,
  translation,
  'data-testid': dataTestId,
  ...datePickerProps
}: Props<T> & DatePickerProps<Dayjs>) => {
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
          }}
          onChange={(date) => {
            if (date && date.isValid()) {
              onChange(date.utc(true).format())
            }
          }}
          value={value ? dayjs(value) : null}
        />
      )}
    />
  )
}
