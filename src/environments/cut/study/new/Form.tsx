'use client'

import Block from '@/components/base/Block'
import { FormTextField } from '@/components/form/TextField'
import WeekScheduleForm from '@/components/form/WeekScheduleForm'
import GlobalNewStudyForm from '@/components/study/new/Form'
import { getOrganizationUsers } from '@/db/organization'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { DayOfWeek, User } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  user: User
  users: Awaited<ReturnType<typeof getOrganizationUsers>>
  form: UseFormReturn<CreateStudyCommand>
}

const NewStudyForm = ({ user, users, form }: Props) => {
  const t = useTranslations('study.new')
  const openingHours = form.watch('openingHours')
  const openingHoursHoliday = form.watch('openingHoursHoliday')

  const days: DayOfWeek[] = useMemo(() => Object.keys(openingHours || {}) as DayOfWeek[], [openingHours])
  const daysHoliday: DayOfWeek[] = useMemo(
    () => Object.keys(openingHoursHoliday || {}) as DayOfWeek[],
    [openingHoursHoliday],
  )

  useEffect(() => {
    if (!form.getValues('openingHours')) {
      form.setValue('openingHours', {
        Monday: { day: 'Monday', openHour: '', closeHour: '', isHoliday: false },
        Tuesday: { day: 'Tuesday', openHour: '', closeHour: '', isHoliday: false },
        Wednesday: { day: 'Wednesday', openHour: '', closeHour: '', isHoliday: false },
        Thursday: { day: 'Thursday', openHour: '', closeHour: '', isHoliday: false },
        Friday: { day: 'Friday', openHour: '', closeHour: '', isHoliday: false },
        Saturday: { day: 'Saturday', openHour: '', closeHour: '', isHoliday: false },
        Sunday: { day: 'Sunday', openHour: '', closeHour: '', isHoliday: false },
      })
    }
  }, [form])

  const handleCheckDay = useCallback(
    (day: DayOfWeek) => {
      const existingHolidayDay = day in (openingHoursHoliday || {})
      if (existingHolidayDay) {
        const updatedHolidays = { ...openingHoursHoliday }
        delete updatedHolidays[day]
        form.setValue('openingHoursHoliday', updatedHolidays)
      } else {
        form.setValue('openingHoursHoliday', { ...(openingHoursHoliday || {}), [day]: { day, isHoliday: true } })
      }
    },
    [openingHoursHoliday, form],
  )

  return (
    <Block title={t('title')} as="h1">
      <GlobalNewStudyForm user={user} users={users} form={form}>
        <WeekScheduleForm
          label={t('openingHours')}
          days={days}
          name={'openingHours'}
          control={form.control}
          onCheckDay={handleCheckDay}
        />
        <WeekScheduleForm
          label={t('openingHoursHoliday')}
          days={daysHoliday}
          name={'openingHoursHoliday'}
          control={form.control}
        />
        <FormTextField
          control={form.control}
          name="numberOfSessions"
          data-testid="new-study-number-of-sessions"
          label={t('numberOfSessions')}
          translation={t}
          type="number"
        />
      </GlobalNewStudyForm>
    </Block>
  )
}

export default NewStudyForm
