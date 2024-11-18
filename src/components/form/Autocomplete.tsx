import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import { Autocomplete, AutocompleteProps, TextField } from '@mui/material'

type Option = { label: string; value: string }

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
  helperText?: string
  translation: (slug: string) => string
}

export const FormAutocomplete = <T extends FieldValues>({
  name,
  control,
  label,
  translation,
  helperText,
  ...autocompleteProps
}: Props<T> & Omit<AutocompleteProps<string | Option, false, false, boolean>, 'renderInput'>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Autocomplete
          {...autocompleteProps}
          onChange={(_, newValue) => onChange(typeof newValue === 'string' ? newValue : newValue?.value)}
          value={value}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
          filterOptions={(options, { inputValue }) =>
            options.filter((option) =>
              typeof option === 'string'
                ? option
                : option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.value.toLowerCase().includes(inputValue.toLowerCase()),
            )
          }
          renderInput={(params) => (
            <TextField
              {...params}
              slotProps={{
                formHelperText: {
                  // @ts-expect-error: Known missing props in TS
                  'data-testid': `${name}-autocomplete-helper-text`,
                },
              }}
              label={label}
              helperText={(error && error.message ? translation('validation.' + error.message) : null) || helperText}
              error={!!error}
            />
          )}
        />
      )}
    />
  )
}
