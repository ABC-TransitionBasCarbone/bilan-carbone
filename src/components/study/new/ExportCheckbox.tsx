import { Select } from '@/components/base/Select'
import { Checkbox, FormControl, FormControlLabel, MenuItem } from '@mui/material'
import { ControlMode, Export } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction } from 'react'
import styles from './ExportCheckbox.module.css'

interface Props {
  id: Export
  values: Record<Export, ControlMode | false>
  setValues: Dispatch<SetStateAction<Record<Export, ControlMode | false>>>
  disabled?: boolean
}

const ExportCheckbox = ({ id, values, setValues, disabled }: Props) => {
  const t = useTranslations('study.new')
  const tExport = useTranslations('exports')

  return (
    <div className={styles.container}>
      <FormControlLabel
        className={styles.field}
        control={
          <Checkbox checked={!!values[id]} className={styles.checkbox} disabled={id !== Export.Beges || disabled} />
        }
        label={
          <span>
            {tExport(id)}
            {id !== Export.Beges && <em> ({t('coming')})</em>}
          </span>
        }
        value={!!values[id]}
        onChange={(_, checked) => setValues({ ...values, [id]: checked ? ControlMode.Operational : false })}
      />
      {values[id] && (
        <div className={styles.field}>
          <FormControl fullWidth>
            <Select
              value={values[id]}
              onChange={(event) => setValues({ ...values, [id]: event.target.value as ControlMode })}
              disabled={disabled}
            >
              {Object.keys(ControlMode).map((key) => (
                <MenuItem key={key} value={key} disabled={key !== ControlMode.Operational}>
                  {t(key)}
                  {key !== ControlMode.Operational && <em> ({t('coming')})</em>}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      )}
    </div>
  )
}

export default ExportCheckbox
