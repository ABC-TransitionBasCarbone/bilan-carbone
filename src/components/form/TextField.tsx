import TextField, { TextFieldProps } from '@mui/material/TextField'
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
}

export const FormTextField = <T extends FieldValues>({
  name,
  control,
  translation,
  label,
  icon,
  iconPosition = 'before',
  endAdornment,
  ...textFieldProps
}: Props<T> & TextFieldProps) => {
  const iconDiv = icon ? <div className={styles.icon}>{icon}</div> : null
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div className="inputContainer">
          {label ? (
            <IconLabel icon={iconDiv} iconPosition={iconPosition} className="mb-2">
              <span className="inputLabel bold">{label}</span>
            </IconLabel>
          ) : null}
          <TextField
            {...textFieldProps}
            helperText={error && error.message ? translation('validation.' + error.message) : null}
            error={!!error}
            onChange={
              textFieldProps.type === 'number'
                ? (event) => {
                    onChange(parseFloat(event.target.value))
                  }
                : onChange
            }
            value={textFieldProps.type === 'number' && Number.isNaN(value) ? '' : value}
            slotProps={{
              input: {
                onWheel: (event) => (event.target as HTMLInputElement).blur(),
                sx: { borderRadius: '0.75rem', borderColor: 'var(--color-grey-400)', color: 'var(--color-grey-950)' },
                endAdornment,
              },
            }}
          />
        </div>
      )}
    />
  )
}
