import { Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select } from '@mui/material'
import { ControlMode, Export } from '@prisma/client'
import { useTranslations } from 'next-intl'
import React, { Dispatch, SetStateAction } from 'react'
import styles from './styles.module.css'

interface Props {
  id: Export
  values: Record<Export, ControlMode | false>
  setValues: Dispatch<SetStateAction<Record<Export, ControlMode | false>>>
}

const ExportCheckbox = ({ id, values, setValues }: Props) => {
  const t = useTranslations('study.new')
  return (
    <div className={styles.container}>
      <FormControlLabel
        control={<Checkbox />}
        label={t(id)}
        value={!!values[id]}
        onChange={(_, checked) => setValues({ ...values, [id]: checked ? ControlMode.CapitalShare : false })}
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
                <MenuItem key={key} value={key}>
                  {t(key)}
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
