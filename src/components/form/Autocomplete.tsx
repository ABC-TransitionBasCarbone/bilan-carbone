import { Autocomplete, AutocompleteProps, TextField } from '@mui/material'
import classNames from 'classnames'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import styles from './Form.module.css'

type Option = { label: string; value: string }

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
  icon?: React.ReactNode
  iconPosition?: 'before' | 'after'
  helperText?: string
  translation: (slug: string) => string
}

export const FormAutocomplete = <T extends FieldValues>({
  name,
  control,
  label,
  icon,
  iconPosition = 'before',
  translation,
  helperText,
  ...autocompleteProps
}: Props<T> & Omit<AutocompleteProps<string | Option, false, false, boolean>, 'renderInput'>) => {
  const iconDiv = icon ? <div className={styles.icon}>{icon}</div> : null
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div className="inputContainer">
          {label ? (
            <div className={classNames(styles.gapped, 'mb-2 align-center')}>
              {iconPosition === 'before' && iconDiv}
              <span className="inputLabel bold">{label}</span>
              {iconPosition === 'after' && iconDiv}
            </div>
          ) : null}
          <Autocomplete
            {...autocompleteProps}
            onChange={(_, option) => onChange(typeof option === 'string' ? option : option?.value)}
            value={value}
            clearIcon={null}
            renderInput={(params) => (
              <TextField
                {...params}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'var(--color-grey-400)', borderRadius: '0.75rem' },
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--color-grey-950)',
                  },
                }}
                slotProps={{
                  formHelperText: {
                    // @ts-expect-error: Known missing props in TS
                    'data-testid': `${name}-autocomplete-helper-text`,
                  },
                }}
                helperText={(error && error.message ? translation('validation.' + error.message) : null) || helperText}
                error={!!error}
              />
            )}
          />
        </div>
      )}
    />
  )
}
