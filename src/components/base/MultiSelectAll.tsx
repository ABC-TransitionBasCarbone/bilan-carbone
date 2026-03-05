import { Checkbox, ListItemText, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface Props<T> {
  id: string
  values: T[]
  allValues: T[]
  setValues: (allValues: T[]) => void
  getLabel: (value: string) => string
  label?: string
}

const MultiSelectAll = <T extends string>({ id, values, allValues, setValues, getLabel, label }: Props<T>) => {
  const tCommon = useTranslations('common')
  const allSelected = useMemo<boolean>(
    () => values.filter((item) => item !== 'all').length === allValues.length,
    [values, allValues],
  )

  // Only show the "all" option if there are at least 2 values to select from
  const valuesWithAllHandled = (
    allValues.length > 1 && allValues.length === values.length ? [...values, 'all'] : values
  ) as (T | 'all')[]

  const renderValue = () => {
    if (valuesWithAllHandled.length === 0) {
      return tCommon('none')
    } else if (valuesWithAllHandled.includes('all')) {
      return tCommon('all')
    }

    return valuesWithAllHandled.map((v) => getLabel(v)).join(', ')
  }

  const onChange = (event: SelectChangeEvent<string | (T | 'all')[]>) => {
    const {
      target: { value: newValues },
    } = event

    if (!Array.isArray(newValues)) {
      return
    }

    const allWasSelected = values.length === allValues.length
    const allSelected = newValues.includes('all') || (newValues.length === allValues.length && !allWasSelected)

    if (allSelected && !allWasSelected) {
      setValues(allValues)
    } else if (allWasSelected && !allSelected) {
      setValues([])
    } else {
      const target = newValues.filter((val): val is T => val !== 'all')
      setValues(target)
    }
  }

  return (
    <Select
      id={`${id}-selector`}
      labelId={`${id}-selector`}
      value={valuesWithAllHandled}
      onChange={onChange}
      renderValue={renderValue}
      multiple
      displayEmpty
      label={label ?? undefined}
    >
      {allValues.length > 1 && (
        <MenuItem key={`${id}-item-all`} value="all">
          <Checkbox checked={allSelected} />
          <ListItemText primary={allSelected ? tCommon('action.unselectAll') : tCommon('action.selectAll')} />
        </MenuItem>
      )}
      {allValues
        .filter((option) => option !== '')
        .sort((a, b) => getLabel(a).localeCompare(getLabel(b)))
        .map((option) => (
          <MenuItem key={`${id}-item-${option}`} value={option || ''}>
            <Checkbox checked={valuesWithAllHandled.includes(option)} />
            <ListItemText primary={getLabel(option)} />
          </MenuItem>
        ))}
    </Select>
  )
}

export default MultiSelectAll
