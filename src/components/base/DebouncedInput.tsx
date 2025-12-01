import { TextField, TextFieldProps } from '@mui/material'
import { InputHTMLAttributes, useEffect, useRef, useState } from 'react'
import styles from '../form/Form.module.css'

interface Props {
  debounce: number
  value: string
  onChange: (value: string) => void
  size?: 'small' | 'medium'
}

const DebouncedInput = ({
  value: initialValue = '',
  onChange,
  debounce,
  size = 'medium',
  ...props
}: Props & Omit<TextFieldProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'>) => {
  const [value, setValue] = useState(initialValue)
  const previousValue = useRef(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (previousValue.current === value) {
      return
    }

    const timeout = setTimeout(() => {
      onChange(value)
      previousValue.current = value
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, onChange, debounce])

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
      onChange={(e) => {
        setValue(e.target.value)
      }}
    />
  )
}

export default DebouncedInput
