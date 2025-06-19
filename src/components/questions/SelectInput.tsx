import { FormControl, FormHelperText, InputLabel, MenuItem, Select, SelectProps } from '@mui/material'
import { SelectHTMLAttributes, useCallback } from 'react'

interface Option {
  value: string
  label: string
}

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  onUpdate: () => void
  options: Option[]
  error?: boolean
  helperText?: string
}

const SelectInput = ({
  label,
  value,
  onChange,
  onUpdate,
  options,
  error = false,
  helperText,
  ...props
}: Props & Omit<SelectProps & SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>) => {
  const handleUpdate = useCallback(() => {
    if (onUpdate) {
      onUpdate()
    }
  }, [onUpdate])

  return (
    <div className="flex grow mr1">
      <FormControl fullWidth error={error}>
        <InputLabel shrink>{label}</InputLabel>
        <Select
          {...props}
          value={value}
          onChange={(event) => {
            onChange(event.target.value as string)
            handleUpdate()
          }}
          label={label}
          displayEmpty
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
      </FormControl>
    </div>
  )
}

export default SelectInput
