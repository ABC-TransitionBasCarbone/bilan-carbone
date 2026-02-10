import { Checkbox, ListItemText, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface Props<T> {
  id: string
  values: T[]
  allValues: T[]
  setValues: (allValues: T[]) => void
  getLabel: (value: string) => string
}

const MultiSelectAll = <T extends string>({ id, values, allValues, setValues, getLabel }: Props<T>) => {
  const tCommon = useTranslations('common')
  const allSelected = useMemo<boolean>(
    () => values.filter((item) => item !== 'all').length === allValues.length,
    [values, allValues],
  )

  const valuesWithAllHandled = (allValues.length === values.length ? [...values, 'all'] : values) as (T | 'all')[]

  const renderValue = () => {
    if (allValues.length === 0 || valuesWithAllHandled.length === 0) {
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
    >
      <MenuItem key={`${id}-item-all`} value="all">
        <Checkbox checked={allSelected} />
        <ListItemText primary={allSelected ? tCommon('action.unselectAll') : tCommon('action.selectAll')} />
      </MenuItem>
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
