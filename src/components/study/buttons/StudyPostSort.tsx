import { EmissionSourcesSort } from '@/types/filters'
import { Checkbox, FormControl, ListItemText, MenuItem, Select } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './StudyPostFilters.module.css'

interface Props {
  sort: EmissionSourcesSort
  setSort: (field: EmissionSourcesSort['field'], order: EmissionSourcesSort['order']) => void
}

const StudyPostFilters = ({ sort, setSort }: Props) => {
  const t = useTranslations('study.post')

  const col1fields = ['activityData', 'emissionFactor'] as const
  const col2fields = ['emissions', 'uncertainty'] as const

  const onChange = (field: EmissionSourcesSort['field'], order: EmissionSourcesSort['order']) => {
    const targetField = field === sort.field && order === sort.order ? undefined : field
    setSort(targetField, order)
  }

  return (
    <FormControl className={styles.selector}>
      <Select
        id="emissions-sources-sort"
        labelId="emissions-sources-sort"
        value={[' ']}
        renderValue={() => <div className="align-center">{t('sort')}</div>}
        MenuProps={{
          PaperProps: {
            sx: {
              '& .MuiList-root': {
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                margin: '1rem',
              },
            },
          },
        }}
        multiple
      >
        {[col1fields, col2fields].map((fields, i) => (
          <div key={i}>
            {fields.map((field) => (
              <div key={field}>
                <span className="bold">{t(field)}</span>
                <MenuItem key={`field-${field}-asc`} className="p0" onClick={() => onChange(field, 'asc')}>
                  <Checkbox checked={sort.field === field && sort.order === 'asc'} />
                  <ListItemText primary={t('asc')} />
                </MenuItem>
                <MenuItem key={`field-${field}-desc`} className="p0" onClick={() => onChange(field, 'desc')}>
                  <Checkbox checked={sort.field === field && sort.order === 'desc'} />
                  <ListItemText primary={t('desc')} />
                </MenuItem>
              </div>
            ))}
          </div>
        ))}
      </Select>
    </FormControl>
  )
}

export default StudyPostFilters
