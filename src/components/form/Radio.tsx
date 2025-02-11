import { FormControl, FormHelperText, FormLabel, RadioGroup, RadioGroupProps } from '@mui/material'
import classNames from 'classnames'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'
import styles from './Form.module.css'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
  icon?: React.ReactNode
  iconPosition?: 'before' | 'after'
  translation: (slug: string) => string
}

export const FormRadio = <T extends FieldValues>({
  name,
  control,
  label,
  icon,
  iconPosition = 'before',
  translation,
  ...radioProps
}: Props<T> & RadioGroupProps) => {
  const iconDiv = icon ? <div className={styles.icon}>{icon}</div> : null
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormControl error={!!error} component="fieldset">
          {label ? (
            <FormLabel id={`${name}-radio-group-label`} component="legend">
              <div className={classNames(styles.gapped, 'mb-2 align-center')}>
                {iconPosition === 'before' && iconDiv}
                <span className="inputLabel bold">{label}</span>
                {iconPosition === 'after' && iconDiv}
              </div>
            </FormLabel>
          ) : null}
          <RadioGroup
            {...radioProps}
            aria-labelledby={`${name}-radio-group-label`}
            name={name}
            value={value}
            onChange={onChange}
          />
          {error && error.message && <FormHelperText>{translation('validation.' + error.message)}</FormHelperText>}
        </FormControl>
      )}
    />
  )
}
