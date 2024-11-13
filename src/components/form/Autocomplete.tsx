import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import { Autocomplete, AutocompleteProps, TextField } from '@mui/material'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
  freeSolo?: boolean
  translation: (slug: string) => string
  onChangedValue?: (value: string | null) => void
}

export const FormAutocomplete = <T extends FieldValues, Value>({
  name,
  control,
  label,
  translation,
  onChangedValue,
  freeSolo = false,
  ...autocompleteProps
}: Props<T> & Omit<AutocompleteProps<string | Value, false, false, boolean>, 'renderInput'>) => {
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
          onInputChange={(_, newValue) => {
            if (onChangedValue) {
              onChangedValue(newValue as string)
            }
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
          freeSolo={freeSolo}
        />
      )}
    />
  )
}
