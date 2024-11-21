'use client'

import { FullStudy } from '@/db/study'
import React, { useEffect } from 'react'
import styles from './StudyPerimeter.module.css'
import { FormDatePicker } from '@/components/form/DatePicker'
import { useFormatter, useTranslations } from 'next-intl'
import { ChangeStudyDatesCommand, ChangeStudyDatesCommandValidation } from '@/services/serverFunctions/study.command'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import classNames from 'classnames'
import { OrganizationWithSites } from '@/db/user'
import Sites from '@/components/organization/Sites'
import { StudyRole } from '@prisma/client'
import { changeStudyDates } from '@/services/serverFunctions/study'

interface Props {
  study: FullStudy
  userRoleOnStudy?: FullStudy['allowedUsers'][0]
  organization: OrganizationWithSites
}

const StudyPerimeter = ({ study, userRoleOnStudy, organization }: Props) => {
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
          })}{' '}
        </p>
      )}
      <Sites sites={organization.sites} />
    </>
  )
}

export default StudyPerimeter
