import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import { Autocomplete, AutocompleteProps, TextField } from '@mui/material'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
  translation: (slug: string) => string
}

export const FormAutocomplete = <T extends FieldValues, Value>({
  name,
  control,
  label,
  translation,
  ...autocompleteProps
}: Props<T> & Omit<AutocompleteProps<Value, false, false, false>, 'renderInput'>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Autocomplete
          {...autocompleteProps}
          onChange={(_, newValue) => {
            onChange(newValue)
          }}
          value={value}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              helperText={error && error.message ? translation('validation.' + error.message) : null}
              error={!!error}
            />
          )}
        />
      )}
    />
  )
}
