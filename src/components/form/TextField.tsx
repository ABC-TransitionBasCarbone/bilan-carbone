import { FormControl, FormHelperText, Typography } from '@mui/material'
import TextField, { TextFieldProps } from '@mui/material/TextField'
import { useCallback } from 'react'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import IconLabel from '../base/IconLabel'
import styles from './Form.module.css'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
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
  label,
  icon,
  iconPosition = 'before',
  endAdornment,
  customError,
  trim,
  ...textFieldProps
}: Props<T> & TextFieldProps) => {
  const iconDiv = icon ? <div className={styles.icon}>{icon}</div> : null
  const isMultiline = textFieldProps.multiline

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
            <>
              {iconDiv ? (
                <IconLabel icon={iconDiv} iconPosition={iconPosition} className="mb-2">
                  <span className="inputLabel bold">{label}</span>
                </IconLabel>
              ) : (
                <Typography fontWeight="bold" className="mb-2">
                  {label}
                </Typography>
              )}
            </>
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
            minRows={isMultiline ? textFieldProps.rows || 2 : undefined}
            className={isMultiline ? styles.multilineResizable : undefined}
            slotProps={{
              input: isMultiline
                ? {
                    endAdornment,
                  }
                : {
                    onWheel: (event) => (event.target as HTMLInputElement).blur(),
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
