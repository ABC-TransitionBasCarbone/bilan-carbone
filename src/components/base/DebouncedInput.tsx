import { TextField, TextFieldProps } from '@mui/material'
import { InputHTMLAttributes, useEffect, useState } from 'react'

interface Props {
  debounce: number
  value: string
  onChange: (value: string) => void
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce,
  ...props
}: Props & Omit<TextFieldProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return <TextField {...props} value={value} onChange={(e) => setValue(e.target.value)} />
}

export default DebouncedInput
