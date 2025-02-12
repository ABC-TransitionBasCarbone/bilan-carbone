import { FormControl, FormHelperText, SelectProps } from '@mui/material'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import IconLabel from '../base/IconLabel'
import { Select } from '../base/Select'
import styles from './Form.module.css'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  translation: (slug: string) => string
  icon?: React.ReactNode
  iconPosition?: 'before' | 'after'
}

export const FormSelect = <T extends FieldValues>({
  name,
  control,
  label,
  icon,
  iconPosition = 'before',
  translation,
  ...selectProps
}: Props<T> & SelectProps) => {
  const iconDiv = icon ? <div className={styles.icon}>{icon}</div> : null
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormControl error={!!error} fullWidth={selectProps.fullWidth} className="inputContainer">
          {label ? (
            <IconLabel icon={iconDiv} iconPosition={iconPosition} className="mb-2">
              <span className="inputLabel bold">{label}</span>
            </IconLabel>
          ) : null}
          <Select name={name} value={value} onChange={onChange} {...selectProps} />
          {error && error.message && <FormHelperText>{translation('validation.' + error.message)}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
