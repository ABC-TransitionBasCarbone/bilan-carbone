import { FormControl, FormHelperText } from '@mui/material'
import TextField, { TextFieldProps } from '@mui/material/TextField'
import { useCallback } from 'react'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import IconLabel from '../base/IconLabel'
import styles from './Form.module.css'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  translation: (slug: string) => string
  label?: string
  icon?: React.ReactNode
  iconPosition?: 'before' | 'after'
  endAdornment?: React.ReactNode
  customError?: string
  trim?: boolean
}

export const FormTextField = <T extends FieldValues>({
  name,
  control,
  translation,
  label,
  icon,
  iconPosition = 'before',
  endAdornment,
  customError,
  trim,
  ...textFieldProps
}: Props<T> & TextFieldProps) => {
  const iconDiv = icon ? <div className={styles.icon}>{icon}</div> : null

  const handleChange = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      onChange: (...event: (string | number | null)[]) => void,
    ) => {
      if (textFieldProps.type === 'number') {
        const value = event.target.value.trim()
        return onChange(value === '' ? null : parseFloat(value))
      }
      if (trim) {
        return onChange(event.target.value.trim())
      }
      return onChange(event.target.value)
    },
    [textFieldProps.type, trim],
  )

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormControl fullWidth={textFieldProps.fullWidth} error={!!error || !!customError} className="inputContainer">
          {label ? (
            <IconLabel icon={iconDiv} iconPosition={iconPosition} className="mb-2">
              <span className="inputLabel bold">{label}</span>
            </IconLabel>
          ) : null}
          <TextField
            {...textFieldProps}
            error={!!error || !!customError}
            onChange={(event) => handleChange(event, onChange)}
            value={
              (textFieldProps.type === 'number' && Number.isNaN(value)) || value === undefined || value === null
                ? ''
                : value
            }
            slotProps={{
              input: {
                onWheel: (event) => (event.target as HTMLInputElement).blur(),
                className: styles.textFieldInput,
                endAdornment,
              },
            }}
          />
          {(customError || error?.message) && (
            <FormHelperText className={styles.helper}>{customError ?? error?.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  )
}
