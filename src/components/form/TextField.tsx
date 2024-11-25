import TextField, { TextFieldProps } from '@mui/material/TextField'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  translation: (slug: string) => string
}

export const FormTextField = <T extends FieldValues>({
  name,
  control,
  translation,
  ...textFieldProps
}: Props<T> & TextFieldProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <TextField
          {...textFieldProps}
          helperText={error && error.message ? translation('validation.' + error.message) : null}
          error={!!error}
          onChange={
            textFieldProps.type === 'number'
              ? (event) => {
                  onChange(parseFloat(event.target.value))
                }
              : onChange
          }
          value={value}
          slotProps={{ input: { onWheel: (event) => (event.target as HTMLInputElement).blur() } }}
        />
      )}
    />
  )
}
