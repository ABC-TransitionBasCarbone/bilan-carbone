import { MenuItem, SelectChangeEvent, SelectProps } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import styles from './MultiSelect.module.css'
import { Select } from './Select'

interface MultiSelectProps {
  icon?: React.ReactNode
  placeholder?: string
  iconPosition?: 'before' | 'after'
  options: { label: string; value: string }[]
  onChange: (value: string[]) => void
  clearable?: boolean
}

export const MultiSelect = ({
  name,
  label,
  value,
  onChange,
  options,
  placeholder,
  clearable,
  ...selectProps
}: Omit<SelectProps, 'onChange'> & MultiSelectProps) => {
  const [selected, setSelected] = useState<string[]>(
    typeof value === 'string' ? (value.split(',') as string[]) : (value as string[]),
  )

  useEffect(() => {
    const newValue = typeof value === 'string' ? (value.split(',') as string[]) : (value as string[])
    setSelected(newValue)
  }, [value])

  const selectedLabels = useMemo(
    () => selected.map((v) => options.find((o) => o.value === v)?.label),
    [selected, options],
  )

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const {
      target: { value },
    } = event

    const tmpSelected: string[] =
      typeof value === 'string' ? (value ? (value.split(',') as string[]) : []) : (value as string[])
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
      displayEmpty
      renderValue={() => {
        if (selectedLabels.length === 0) {
          return <em>{placeholder}</em>
        }
        return selectedLabels.join(', ')
      }}
      clearable={clearable && selected.length > 0}
      className={styles.multiSelect}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  )
}
