'use client'

import Block from '@/components/base/Block'
import { FormTextField } from '@/components/form/TextField'
import WeekScheduleForm from '@/components/form/WeekScheduleForm'
import GlobalNewStudyForm from '@/components/study/new/Form'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { DayOfWeek } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  user: UserSession
  accounts: Awaited<ReturnType<typeof getOrganizationVersionAccounts>>
  form: UseFormReturn<CreateStudyCommand>
}

const NewStudyForm = ({ user, accounts, form }: Props) => {
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
      const defaultOpeningHours = Object.values(DayOfWeek).reduce(
        (acc, day) => {
          acc[day] = { day, openHour: '', closeHour: '', isHoliday: false }
          return acc
        },
        {} as Record<DayOfWeek, { day: DayOfWeek; openHour: string; closeHour: string; isHoliday: boolean }>,
      )
      form.setValue('openingHours', defaultOpeningHours)
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
      <GlobalNewStudyForm user={user} accounts={accounts} form={form}>
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
        <FormTextField
          control={form.control}
          name="numberOfTickets"
          data-testid="new-study-number-of-tickets"
          label={t('numberOfTickets')}
          translation={t}
          type="number"
        />
        <FormTextField
          control={form.control}
          name="numberOfOpenDays"
          data-testid="new-study-number-of-open-days"
          label={t('numberOfOpenDays')}
          translation={t}
          type="number"
        />
      </GlobalNewStudyForm>
    </Block>
  )
}

export default NewStudyForm
