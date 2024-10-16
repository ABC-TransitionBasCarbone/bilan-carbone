import {
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import styles from './Form.module.css'
import { ControlMode, Export, StudyType } from '@prisma/client'
import ExportCheckbox from './ExportCheckbox'

const NewStudyForm = () => {
  const t = useTranslations('study.new')
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(dayjs())
  const [endDate, setEndDate] = useState(dayjs())
  const [type, setType] = useState<StudyType>(StudyType.Standard)
  const [privateStudy, setPrivateStudy] = useState(true)
  const [exports, setExports] = useState<Record<Export, ControlMode | false>>({
    [Export.Beges]: false,
    [Export.GHGP]: false,
    [Export.ISO14069]: false,
  })

  return (
    <form className={styles.form}>
      <TextField label={t('name')} value={name} onChange={(event) => setName(event.target.value)}></TextField>
      <div className={styles.dates}>
        <DatePicker
          label={t('start')}
          value={startDate}
          onChange={(value) => {
            if (value) {
              setStartDate(value)
            }
          }}
        />
        <DatePicker
          label={t('end')}
          value={endDate}
          onChange={(value) => {
            if (value) {
              setEndDate(value)
            }
          }}
        />
      </div>
      <FormControl>
        <InputLabel id="type-select-label">{t('type')}</InputLabel>
        <Select
          label={t('type')}
          labelId="type-select-label"
          value={type}
          onChange={(event) => setType(event.target.value as StudyType)}
        >
          {Object.keys(StudyType).map((key) => (
            <MenuItem key={key} value={key}>
              {t(key)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel id="private-radio-group-label">{t('private-title')}</FormLabel>
        <RadioGroup
          row
          aria-labelledby="private-radio-group-label"
          name="private-radio-group-label"
          value={privateStudy}
          onChange={(_, value) => setPrivateStudy(value === 'true')}
        >
          <FormControlLabel value="true" control={<Radio />} label={t('private')} />
          <FormControlLabel value="false" control={<Radio />} label={t('public')} />
        </RadioGroup>
      </FormControl>
      <FormLabel>{t('exports')}</FormLabel>
      <div className={styles.exports}>
        {Object.keys(Export).map((key) => (
          <ExportCheckbox key={key} id={key as Export} values={exports} setValues={setExports} />
        ))}
      </div>
    </form>
  )
}

export default NewStudyForm
