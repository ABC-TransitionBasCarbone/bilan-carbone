import { Box, Chip, MenuItem, SelectChangeEvent, SelectProps } from '@mui/material'
import { Select } from './Select'
import { useState } from 'react'

interface MultiSelectProps {
  icon?: React.ReactNode
  iconPosition?: 'before' | 'after'
  options: { label: string; value: string }[]
  onChange: (value: string[]) => void
}

export const MultiSelect = ({
  name,
  label,
  value,
  onChange,
  options,
  icon,
  iconPosition,
  ...selectProps
}: MultiSelectProps & SelectProps) => {
  const [selected, setSelected] = useState<string[]>(typeof value === 'string' ? (value.split(',') as string[]) : (value as string[]))

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const {
      target: { value },
    } = event

    const tmpSelected :string[] = typeof value === 'string' ? (value.split(',') as string[]) : (value as string[])
    onChange(tmpSelected)
    setSelected(tmpSelected)
  }
  return (
    <Select
      multiple
      name={name}
      label={label}
      value={selected || []}
      onChange={handleChange}
      {...selectProps}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  )
}
