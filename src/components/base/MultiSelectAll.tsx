import { useUnitLabel } from '@/services/unit'
import { Checkbox, ListItemText, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { useMemo } from 'react'

interface Props {
  id: string
  renderValue: () => string
  value: string[]
  allValues: string[]
  setValues: (allValues: string[]) => void
}

const MultiSelect = ({ id, renderValue, value, allValues, setValues }: Props) => {
  const t = useUnitLabel()
  const allUnitsSelected = useMemo(
    () => value.filter((unit) => unit !== 'all').length === allValues.length,
    [value, allValues],
  )

  const onChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event

    const allSelected = (value as unknown as string[]).filter((unit) => unit !== 'all').length === allValues.length

    if ((value as unknown as string[]).includes('all') !== allUnitsSelected) {
      setValues(allSelected ? [] : [...allValues, 'all'])
    } else {
      const target = allSelected
        ? [...allValues, 'all']
        : (value as unknown as string[]).filter((unit) => unit !== 'all')
      setValues(target)
    }
  }

  return (
    <Select
      id={`${id}-selector`}
      labelId={`${id}-selector`}
      value={value}
      onChange={onChange}
      renderValue={renderValue}
      multiple
    >
      <MenuItem key={`${id}-item-all`} value="all">
        <Checkbox checked={value.includes('all')} />
        <ListItemText primary={t(value.includes('all') ? 'unSelectAll' : 'selectAll')} />
      </MenuItem>
      {allValues
        .filter((option) => option !== '')
        .sort((a, b) => t(a).localeCompare(t(b)))
        .map((option) => (
          <MenuItem key={`${id}-item-${option}`} value={option || ''}>
            <Checkbox checked={value.includes(option)} />
            <ListItemText primary={t(option)} />
          </MenuItem>
        ))}
    </Select>
  )
}

export default MultiSelect
