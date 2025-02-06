import { Typography } from '@mui/material'
import TextField, { TextFieldProps } from '@mui/material/TextField'
import React from 'react'
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  translation: (slug: string) => string
  label?: string
  icon?: React.ReactNode
}

export const FormTextField = <T extends FieldValues>({
  name,
  control,
  translation,
  label,
  icon,
  ...textFieldProps
}: Props<T> & TextFieldProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div className="inputContainer">
          {label ? (
            icon ? (
              <div className="align-center mb-2" style={{ fontWeight: 'bold' }}>
                {icon}
                <span className="ml-2">{label}</span>
              </div>
            ) : (
              <Typography className="inputLabel">{label}</Typography>
            )
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
                sx: { borderRadius: '12px', borderColor: 'var(--color-grey-400)', color: 'var(--color-grey-950)' },
              },
            }}
          />
        </div>
      )}
    />
  )
}
