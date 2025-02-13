import { Autocomplete, AutocompleteProps, TextField } from '@mui/material'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'

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
          onChange={(_, option) => onChange(typeof option === 'string' ? option : option?.value)}
          value={value}
          clearIcon={null}
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
