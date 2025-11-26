import { Checkbox, CheckboxProps, FormControl, FormHelperText, FormLabel } from '@mui/material'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import styles from './Form.module.css'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label?: string
  translation: (slug: string) => string
}

export const FormCheckbox = <T extends FieldValues>({
  name,
  control,
  label,
  translation,
  ...checkboxProps
}: Props<T> & CheckboxProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormControl error={!!error} component="fieldset">
          {label && (
            <FormLabel id={`${name}-checkbox-label`} component="legend">
              {label}
            </FormLabel>
          )}
          <Checkbox
            {...checkboxProps}
            aria-labelledby={`${name}-checkbox-label`}
            name={name}
            checked={value || false}
            onChange={onChange}
          />
          {error?.message && <FormHelperText className={styles.helper}>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
