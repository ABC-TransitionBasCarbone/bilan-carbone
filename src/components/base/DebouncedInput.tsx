import { InputProps } from '@mui/material'
import React, { InputHTMLAttributes, useEffect, useState } from 'react'
import Input from './Input'

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
}: Props & Omit<InputProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) => {
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

  return <Input {...props} value={value} onChange={(e) => setValue(e.target.value)} />
}

export default DebouncedInput
