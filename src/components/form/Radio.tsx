import { FormControl, FormHelperText, FormLabel, RadioGroup, RadioGroupProps } from '@mui/material'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
  translation: (slug: string) => string
}

export const FormRadio = <T extends FieldValues>({
  name,
  control,
  label,
  translation,
  ...radioProps
}: Props<T> & RadioGroupProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormControl error={!!error} component="fieldset">
          <FormLabel id={`${name}-radio-group-label`} component="legend">
            {label}
          </FormLabel>
          <RadioGroup
            {...radioProps}
            aria-labelledby={`${name}-radio-group-label`}
            name={name}
            value={value}
            onChange={onChange}
          />
          {error && error.message && <FormHelperText>{translation('validation.' + error.message)}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
