import { useUnitLabel } from '@/services/unit'
import { Translations } from '@/types/translation'
import { Checkbox, ListItemText, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { useTranslations } from 'next-intl'

interface Props<T> {
  id: string
  values: T[]
  allValues: T[]
  setValues: (allValues: T[]) => void
  t: Translations | ReturnType<typeof useUnitLabel>
}

const MultiSelect = <T extends string>({ id, values, allValues, setValues, t }: Props<T>) => {
  const tCommon = useTranslations('common')
  const valuesWithAllHandled = (allValues.length === values.length ? [...values, 'all'] : values) as (T | 'all')[]

  const renderValue = () => {
    if (valuesWithAllHandled.includes('all')) {
      return tCommon('all')
    } else if (valuesWithAllHandled.length === 0) {
      return tCommon('none')
    }

    return valuesWithAllHandled.map((v) => t(v)).join(', ')
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
        <Checkbox checked={valuesWithAllHandled.includes('all')} />
        <ListItemText
          primary={tCommon(valuesWithAllHandled.includes('all') ? 'action.unselectAll' : 'action.selectAll')}
        />
      </MenuItem>
      {allValues
        .filter((option) => option !== '')
        .sort((a, b) => t(a).localeCompare(t(b)))
        .map((option) => (
          <MenuItem key={`${id}-item-${option}`} value={option || ''}>
            <Checkbox checked={valuesWithAllHandled.includes(option)} />
            <ListItemText primary={t(option)} />
          </MenuItem>
        ))}
    </Select>
  )
}

export default MultiSelect
