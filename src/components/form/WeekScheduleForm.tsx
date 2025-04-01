import { DayOfWeek } from '@prisma/client'
import { Control, FieldPath, FieldValues } from 'react-hook-form'
import FormDayHours from './FormDayHours'

interface Props<T extends FieldValues> {
  name: FieldPath<T>
  label: string
  control: Control<T>
  days?: DayOfWeek[]
  onCheckDay?: (day: DayOfWeek) => void
  isChecked?: (day: DayOfWeek) => boolean
  disabled?: boolean
}

const WeekScheduleForm = <T extends FieldValues>({
  name,
  label,
  control,
  days,
  onCheckDay,
  isChecked,
  disabled,
}: Props<T>) => {
  const sortedDays = days?.sort((a, b) => Object.values(DayOfWeek).indexOf(a) - Object.values(DayOfWeek).indexOf(b))

  return (
    <div>
      <div className="mb-2 bold">{label}</div>
      <div>
        {sortedDays?.map((day) => (
          <FormDayHours
            isChecked={isChecked && isChecked(day)}
            disabled={disabled}
            onCheckDay={onCheckDay}
            key={day}
            day={day}
            control={control}
            name={{
              openHour: `${name}.${day}.openHour` as FieldPath<T>,
              closeHour: `${name}.${day}.closeHour` as FieldPath<T>,
              isHoliday: `${name}.${day}.isHoliday` as FieldPath<T>,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default WeekScheduleForm
