import { Translations } from '@abc-transitionbascarbone/common'
import { Select } from '@abc-transitionbascarbone/common/components/base/Select'
import { FormControl, FormHelperText, SelectProps } from '@mui/material'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import styles from './Form.module.css'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  translation: Translations
  icon?: React.ReactNode
  iconPosition?: 'before' | 'after'
  clearable?: boolean
  required?: boolean
}

export const FormSelect = <T extends FieldValues>({
  name,
  control,
  label,
  icon,
  iconPosition = 'before',
  translation,
  clearable,
  required,
  ...selectProps
}: Props<T> & SelectProps) => {
  const iconDiv = icon ? <div className={styles.icon}>{icon}</div> : null
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormControl error={!!error} fullWidth={selectProps.fullWidth} className="inputContainer">
          <Select
            name={name}
            value={value}
            onChange={onChange}
            label={label}
            icon={iconDiv}
            iconPosition={iconPosition}
            clearable={clearable}
            t={translation}
            required={required}
            {...selectProps}
          />
          {error?.message && <FormHelperText className={styles.helper}>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
