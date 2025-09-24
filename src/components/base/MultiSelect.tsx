import { Translations } from '@/types/translation'
import { MenuItem, SelectChangeEvent, SelectProps } from '@mui/material'
import { useMemo, useState } from 'react'
import { Select } from './Select'

interface MultiSelectProps {
  icon?: React.ReactNode
  placeholder?: string
  iconPosition?: 'before' | 'after'
  options: { label: string; value: string }[]
  onChange: (value: string[]) => void
  translation: Translations
  clearable?: boolean
}

export const MultiSelect = ({
  name,
  label,
  value,
  onChange,
  options,
  translation,
  placeholder,
  clearable,
  ...selectProps
}: Omit<SelectProps, 'onChange'> & MultiSelectProps) => {
  const [selected, setSelected] = useState<string[]>(
    typeof value === 'string' ? (value.split(',') as string[]) : (value as string[]),
  )

  const translatedSelected = useMemo(() => selected.map((v) => translation(v)), [selected, translation])

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
      renderValue={() => {
        if (translatedSelected.length === 0) {
          return <em>{placeholder}</em>
        }
        return translatedSelected.join(', ')
      }}
      t={translation}
      clearable={clearable && selected.length > 0}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  )
}
