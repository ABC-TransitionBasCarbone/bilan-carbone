import {MenuItem, SelectChangeEvent, SelectProps } from '@mui/material'
import { Select } from './Select'
import { useMemo, useState } from 'react'

interface MultiSelectProps {
  icon?: React.ReactNode
  placeholder?: string
  iconPosition?: 'before' | 'after'
  options: { label: string; value: string }[]
  onChange: (value: string[]) => void
  translation: (slug: string) => string
}

export const MultiSelect = ({
  name,
  label,
  value,
  onChange,
  options,
  icon,
  iconPosition,
  translation,
  placeholder,
  ...selectProps
}: MultiSelectProps & SelectProps) => {
  const [selected, setSelected] = useState<string[]>(typeof value === 'string' ? (value.split(',') as string[]) : (value as string[]))

  const translatedSelected = useMemo(() => selected.map((v) => translation(v)), [selected, translation])

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
      renderValue={() => {

        if (translatedSelected.length === 0) {
          return <em>{placeholder}</em>;
        }
        return translatedSelected.join(', ');
      }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  )
}
