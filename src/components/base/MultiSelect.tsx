import { Box, Chip, MenuItem, SelectChangeEvent, SelectProps } from '@mui/material'
import { Select } from './Select'

interface MultiSelectProps {
  icon?: React.ReactNode
  iconPosition?: 'before' | 'after'
  options: { label: string; value: string }[]
  onChange: (value : string[]) => void
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

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const {
      target: { value },
    } = event

    const selected: string[] = typeof value === 'string' ? (value.split(',') as string[]) : value as string[]
    onChange(selected)
  }
  return (
    <Select
      multiple
      name={name}
      label={label}
      value={value}
      onChange={handleChange}
      renderValue={(selected) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {(selected as string[]).map((val) => (
            <Chip key={val} label={options.find((option) => option.value === val)?.label || val} />
          ))}
        </Box>
      )}
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