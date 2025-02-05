import { FormControl, FormHelperText, SelectProps } from '@mui/material'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import { Select } from '../base/Select'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  translation: (slug: string) => string
}

export const FormSelect = <T extends FieldValues>({
  name,
  control,
  label,
  translation,
  ...selectProps
}: Props<T> & SelectProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormControl error={!!error} fullWidth={selectProps.fullWidth} className="inputContainer">
          <Select name={name} label={label} value={value} onChange={onChange} {...selectProps} />
          {error && error.message && <FormHelperText>{translation('validation.' + error.message)}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
