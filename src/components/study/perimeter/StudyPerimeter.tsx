'use client'
import { FormDatePicker } from '@/components/form/DatePicker'
import Sites from '@/components/organization/Sites'
import { FullStudy } from '@/db/study'
import { changeStudyDates } from '@/services/serverFunctions/study'
import { ChangeStudyDatesCommand, ChangeStudyDatesCommandValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { useFormatter, useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import styles from './StudyPerimeter.module.css'

interface Props {
  study: FullStudy
  userRoleOnStudy?: FullStudy['allowedUsers'][0]
}

const StudyPerimeter = ({ study, userRoleOnStudy }: Props) => {
  const format = useFormatter()
  const tForm = useTranslations('study.new')
  const t = useTranslations('study.perimeter')

  const form = useForm<ChangeStudyDatesCommand>({
    resolver: zodResolver(ChangeStudyDatesCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      startDate: study.startDate.toISOString(),
      endDate: study.endDate.toISOString(),
    },
  })

  const [startDate, endDate] = form.watch(['startDate', 'endDate'])
  const onSubmit = async (command: ChangeStudyDatesCommand) => {
    await form.trigger()
    if (form.formState.isValid) {
      await changeStudyDates(command)
    }
  }

  useEffect(() => {
    onSubmit(form.getValues())
  }, [startDate, endDate])

  return (
    <>
      {userRoleOnStudy && userRoleOnStudy.role !== StudyRole.Reader ? (
        <div className={classNames(styles.dates, 'flex')}>
          <FormDatePicker control={form.control} translation={tForm} name="startDate" label={tForm('start')} />
          <FormDatePicker
            control={form.control}
            translation={tForm}
            name="endDate"
            label={tForm('end')}
            data-testid="study-endDate"
          />
        </div>
      ) : (
        <p>
          {t('dates', {
            startDate: format.dateTime(new Date(startDate), { year: 'numeric', month: 'long', day: 'numeric' }),
            endDate: format.dateTime(new Date(endDate), { year: 'numeric', month: 'long', day: 'numeric' }),
          })}
        </p>
      )}
      <Sites sites={study.sites.map((site) => ({ ...site, name: site.site.name }))} />
    </>
  )
}

export default StudyPerimeter
