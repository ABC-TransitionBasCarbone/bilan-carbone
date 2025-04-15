import { Checkbox, FormControlLabel, MenuItem } from '@mui/material'
import { DayOfWeek } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { Control, FieldPath, FieldValues } from 'react-hook-form'
import styles from './Form.module.css'
import { FormSelect } from './Select'

interface Props<T extends FieldValues> {
  name: {
    openHour: FieldPath<T>
    closeHour: FieldPath<T>
    isHoliday: FieldPath<T>
  }
  control: Control<T>
  day: DayOfWeek
  onCheckDay?: (day: DayOfWeek) => void
  isChecked?: boolean
  disabled?: boolean
}

const FormDayHours = <T extends FieldValues>({
  name,
  control,
  day,
  onCheckDay,
  disabled = false,
  isChecked,
}: Props<T>) => {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString())
  const t = useTranslations('study.new.days')

  return (
    <div className={styles.row}>
      <div className={styles.day}>{t(day)}</div>

      <div className={styles.separator}>{t('from')}</div>
      <div>
        <FormSelect
          disabled={disabled}
          name={name.openHour}
          className={styles.select}
          control={control}
          translation={t}
        >
          <MenuItem value="">--</MenuItem>
          {hours.map((hour) => (
            <MenuItem key={hour} value={hour}>
              {hour}:00
            </MenuItem>
          ))}
        </FormSelect>
      </div>

      <div className={styles.separator}>{t('to')}</div>
      <div>
        <FormSelect
          disabled={disabled}
          name={name.closeHour}
          className={styles.select}
          control={control}
          translation={t}
        >
          <MenuItem value="">--</MenuItem>
          {hours.map((hour) => (
            <MenuItem key={hour} value={hour}>
              {hour}:00
            </MenuItem>
          ))}
        </FormSelect>
      </div>

      {!!onCheckDay && (
        <FormControlLabel
          label={<span className={styles.checkLabel}>{t('DifferentHoursHoliday')}</span>}
          control={
            <Checkbox
              checked={isChecked}
              disabled={disabled}
              aria-labelledby={`${name}-checkbox-label`}
              onChange={() => onCheckDay(day)}
            />
          }
        />
      )}
    </div>
  )
}

export default FormDayHours
