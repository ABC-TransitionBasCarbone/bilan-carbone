'use client'

import Block from '@/components/base/Block'
import { FormTextField } from '@/components/form/TextField'
import WeekScheduleForm from '@/components/form/WeekScheduleForm'
import StudyParams from '@/components/study/rights/StudyParams'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { changeStudyCinema } from '@/services/serverFunctions/study'
import { ChangeStudyCinemaCommand, ChangeStudyCinemaValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { DayOfWeek, EmissionFactorImportVersion, OpeningHours } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './StudyRights.module.css'

interface Props {
  user: UserSession
  study: FullStudy
  editionDisabled: boolean
  emissionFactorSources: EmissionFactorImportVersion[]
}

const StudyRights = ({ user, study, editionDisabled, emissionFactorSources }: Props) => {
  const t = useTranslations('study.new')
  const { callServerFunction } = useServerFunction()
  const { studySite, setSite } = useStudySite(study)
  const [siteData, setSiteData] = useState<FullStudy['sites'][0] | undefined>()

  useEffect(() => {
    if (studySite) {
      setSiteData(study.sites.find((site) => site.id === studySite))
    }
  }, [studySite])

  const openingHoursToObject = (openingHoursArr: OpeningHours[], isHoliday: boolean = false) => {
    return openingHoursArr.reduce(
      (acc: Record<DayOfWeek, OpeningHours>, openingHour) => {
        if (openingHour.isHoliday === isHoliday) {
          acc[openingHour.day] = {
            ...openingHour,
            openHour: openingHour.openHour ?? '',
            closeHour: openingHour.closeHour ?? '',
          }
        }
        return acc
      },
      {} as Record<DayOfWeek, OpeningHours>,
    )
  }

  const form = useForm<ChangeStudyCinemaCommand>({
    resolver: zodResolver(ChangeStudyCinemaValidation),
    defaultValues: {
      openingHours: openingHoursToObject(siteData?.openingHours ?? []),
      openingHoursHoliday: openingHoursToObject(siteData?.openingHours ?? [], true),
      numberOfOpenDays: siteData?.numberOfOpenDays ?? 0,
      numberOfSessions: siteData?.numberOfSessions ?? 0,
      numberOfTickets: siteData?.numberOfTickets ?? 0,
    },
  })

  const openingHours = form.watch('openingHours')
  const openingHoursHoliday = form.watch('openingHoursHoliday')
  const numberOfOpenDays = form.watch('numberOfOpenDays')
  const numberOfSessions = form.watch('numberOfSessions')
  const numberOfTickets = form.watch('numberOfTickets')

  const days: DayOfWeek[] = useMemo(() => Object.keys(openingHours || {}) as DayOfWeek[], [openingHours])
  const daysHoliday: DayOfWeek[] = useMemo(
    () => Object.keys(openingHoursHoliday || {}) as DayOfWeek[],
    [openingHoursHoliday],
  )

  const handleStudyCinemaUpdate = useCallback(
    async (data: ChangeStudyCinemaCommand) => {
      await callServerFunction(() => changeStudyCinema(studySite, data))
    },
    [callServerFunction],
  )

  const onStudyCinemaUpdate = useCallback(() => {
    form.handleSubmit(handleStudyCinemaUpdate)()
  }, [form, handleStudyCinemaUpdate])

  const handleCheckDay = useCallback(
    (day: DayOfWeek) => {
      const existingHolidayDay = day in (openingHoursHoliday || {})
      if (existingHolidayDay) {
        const updatedHolidays = { ...openingHoursHoliday }
        delete updatedHolidays[day]
        form.setValue('openingHoursHoliday', updatedHolidays)
      } else {
        form.setValue('openingHoursHoliday', {
          ...(openingHoursHoliday || {}),
          [day]: { day, openHour: '', closeHour: '', isHoliday: true },
        })
      }
    },
    [openingHoursHoliday, form],
  )

  const isChecked = useCallback(
    (day: DayOfWeek) => {
      return day in (openingHoursHoliday || {})
    },
    [openingHoursHoliday],
  )

  useEffect(() => {
    if (
      siteData?.numberOfOpenDays !== numberOfOpenDays ||
      siteData?.numberOfSessions !== numberOfSessions ||
      siteData?.numberOfTickets !== numberOfTickets
    ) {
      onStudyCinemaUpdate()
    }
  }, [numberOfOpenDays, numberOfSessions, numberOfTickets, study])

  useEffect(() => {
    onStudyCinemaUpdate()
  }, [JSON.stringify(openingHours), JSON.stringify(openingHoursHoliday)])

  return (
    <>
      <StudyParams user={user} study={study} disabled={editionDisabled} emissionFactorSources={emissionFactorSources} />
      <Block>
        <SelectStudySite study={study} studySite={studySite} setSite={setSite} />
        <div className="mt2">
          <FormTextField
            control={form.control}
            name="numberOfSessions"
            data-testid="new-study-number-of-sessions"
            label={t('numberOfSessions')}
            translation={t}
            type="number"
            className={styles.formTextField}
          />
          <FormTextField
            control={form.control}
            name="numberOfTickets"
            data-testid="new-study-number-of-tickets"
            label={t('numberOfTickets')}
            translation={t}
            type="number"
            className={styles.formTextField}
          />
          <FormTextField
            control={form.control}
            name="numberOfOpenDays"
            data-testid="new-study-number-of-open-days"
            label={t('numberOfOpenDays')}
            translation={t}
            type="number"
            className={styles.formTextField}
          />
        </div>
      </Block>
      <Block title={t('openingHours')}>
        <div className={classNames(styles.openingHoursContainer, 'flex-col')}>
          <WeekScheduleForm
            label={t('openingHours')}
            days={days}
            name={'openingHours'}
            control={form.control}
            disabled={editionDisabled}
            onCheckDay={handleCheckDay}
            isChecked={isChecked}
          />
          {openingHoursHoliday && Object.keys(openingHoursHoliday).length !== 0 && (
            <WeekScheduleForm
              label={t('openingHoursHoliday')}
              days={daysHoliday}
              name={'openingHoursHoliday'}
              control={form.control}
              disabled={editionDisabled}
            />
          )}
        </div>
      </Block>
    </>
  )
}

export default StudyRights
