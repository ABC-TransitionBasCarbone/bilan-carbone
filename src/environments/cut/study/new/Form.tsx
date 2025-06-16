'use client'

import Block from '@/components/base/Block'
import { FormTextField } from '@/components/form/TextField'
import WeekScheduleForm from '@/components/form/WeekScheduleForm'
import GlobalNewStudyForm from '@/components/study/new/Form'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { Export, Level } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  form: UseFormReturn<CreateStudyCommand>
  duplicateStudyId?: string | null
}

const NewStudyForm = ({ form, duplicateStudyId }: Props) => {
  const t = useTranslations('study.new')

  useEffect(() => {
    form.setValue('level', Level.Initial)
    form.setValue('exports', {
      [Export.Beges]: false,
      [Export.GHGP]: false,
      [Export.ISO14069]: false,
    })
  }, [form])

  return (
    <Block title={t('title')} as="h1">
      <GlobalNewStudyForm form={form} t={t} duplicateStudyId={duplicateStudyId}>
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
