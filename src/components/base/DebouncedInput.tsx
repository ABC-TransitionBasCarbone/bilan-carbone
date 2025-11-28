import { TextField, TextFieldProps } from '@mui/material'
import { InputHTMLAttributes, useEffect, useState } from 'react'
import styles from '../form/Form.module.css'

interface Props {
  debounce: number
  value: string
  onChange: (value: string) => void
  size?: 'small' | 'medium'
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce,
  size = 'medium',
  ...props
}: Props & Omit<TextFieldProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'>) => {
  const [value, setValue] = useState(initialValue || '')

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // DO NOT FIX, adding onChange will create an infinite re-render of components that use DebouncedInput
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, debounce])

  return (
    <TextField
      {...props}
      size={size}
      slotProps={{
        input: {
          ...props.slotProps?.input,
          className: styles.textFieldInput,
        },
      }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

export default DebouncedInput
