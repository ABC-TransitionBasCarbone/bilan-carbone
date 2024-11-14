import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import { Autocomplete, AutocompleteProps, TextField } from '@mui/material'
import styles from './Autocomplete.module.css'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
  helperText?: string
  translation: (slug: string) => string
}

export const FormAutocomplete = <T extends FieldValues, Value>({
  name,
  control,
  label,
  translation,
  helperText,
  ...autocompleteProps
}: Props<T> & Omit<AutocompleteProps<string | Value, false, false, boolean>, 'renderInput'>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Autocomplete
          {...autocompleteProps}
          onChange={(_, newValue) => onChange(newValue)}
          value={value}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              helperText={
                <span className={styles.textHelper} data-testid="autocomplete-helper-text">
                  {(error && error.message ? translation('validation.' + error.message) : null) || helperText}
                </span>
              }
              error={!!error}
            />
          )}
        />
      )}
    />
  )
}
