import { Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select } from '@mui/material'
import { ControlMode, Export } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction } from 'react'
import styles from './ExportCheckbox.module.css'

interface Props {
  id: Export
  values: Record<Export, ControlMode | false>
  setValues: Dispatch<SetStateAction<Record<Export, ControlMode | false>>>
}

const ExportCheckbox = ({ id, values, setValues }: Props) => {
  const t = useTranslations('study.new')
  const tExport = useTranslations('exports')

  return (
    <div className={styles.container}>
      <FormControlLabel
        control={<Checkbox />}
        label={tExport(id)}
        value={!!values[id]}
        onChange={(_, checked) => setValues({ ...values, [id]: checked ? ControlMode.Operational : false })}
      />
      {values[id] && (
        <div className={styles.select}>
          <FormControl fullWidth>
            <InputLabel id={`${id}-label`}>{t('control')}</InputLabel>
            <Select
              value={values[id]}
              onChange={(event) => setValues({ ...values, [id]: event.target.value as ControlMode })}
              label={t('control')}
              labelId={`${id}-label`}
              disabled={!values[id]}
            >
              {Object.keys(ControlMode).map((key) => (
                <MenuItem key={key} value={key} disabled={key !== ControlMode.Operational}>
                  {t(key)}
                  {key !== ControlMode.Operational && <em>&nbsp;(à venir)</em>}
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
