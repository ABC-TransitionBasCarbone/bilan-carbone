import { FormControl, FormHelperText } from '@mui/material'
import { TextFieldProps } from '@mui/material/TextField'
import { ChangeEvent } from 'react'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import DebouncedInput from '../base/DebouncedInput'
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
  debounce?: boolean
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
  debounce,
  ...textFieldProps
}: Props<T> & TextFieldProps) => {
  const iconDiv = icon ? <div className={styles.icon}>{icon}</div> : null
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
          <DebouncedInput
            {...Object.fromEntries(Object.entries(textFieldProps).filter(([key]) => key !== 'size'))}
            error={!!error || !!customError}
            debounce={debounce ? 500 : 0}
            onChange={(event) => {
              const val = textFieldProps.type === 'number' ? parseFloat(event) : event
              onChange(val)
              textFieldProps.onChange?.({
                target: { value: event },
              } as unknown as ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)
            }}
            value={(textFieldProps.type === 'number' && Number.isNaN(value)) || value === undefined ? '' : value}
            slotProps={{
              input: {
                onWheel: (event) => (event.target as HTMLInputElement).blur(),
                sx: { borderRadius: '0.75rem', borderColor: 'var(--grayscale-300)', color: 'black' },
                endAdornment,
              },
            }}
          />
          <FormHelperText className={styles.helper}>
            {customError ? customError : error?.message ? translation('validation.' + error.message) : ' '}
          </FormHelperText>
        </FormControl>
      )}
    />
  )
}
