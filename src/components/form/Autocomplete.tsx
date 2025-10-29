import ClearIcon from '@mui/icons-material/Clear'
import {
  Autocomplete,
  AutocompleteProps,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import IconLabel from '../base/IconLabel'
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
}: Props<T> & Omit<AutocompleteProps<string | Option, false, boolean, boolean>, 'renderInput'>) => {
  const iconDiv = icon ? <div className={styles.icon}>{icon}</div> : null
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormControl error={!!error} className="inputContainer">
          {label ? (
            <IconLabel icon={iconDiv} iconPosition={iconPosition} className="mb-2">
              <span className="inputLabel bold">{label}</span>
            </IconLabel>
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
                    '& fieldset': { borderColor: 'var(--grayscale-300)', borderRadius: '0.75rem' },
                  },
                  '& .MuiInputBase-input': {
                    color: 'black',
                  },
                }}
                slotProps={{
                  formHelperText: {
                    // @ts-expect-error: Known missing props in TS
                    'data-testid': `${name}-autocomplete-helper-text`,
                  },
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {value && (
                          <InputAdornment position="end">
                            <IconButton
                              data-testid={`${name}-clear`}
                              aria-label={translation('clear')}
                              onClick={() => onChange({ target: { value: '' } }, null)}
                            >
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
                error={!!error}
              />
            )}
          />
          {(error?.message || helperText) && (
            <FormHelperText className={styles.helper}>{error?.message ?? helperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  )
}
