'use client'

import Block from '@/components/base/Block'
import { FormTextField } from '@/components/form/TextField'
import WeekScheduleForm from '@/components/form/WeekScheduleForm'
import StudyParams from '@/components/study/rights/StudyParams'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { changeStudyCinema, getStudySite } from '@/services/serverFunctions/study'
import { ChangeStudyCinemaCommand, ChangeStudyCinemaValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { DayOfWeek, EmissionFactorImportVersion, OpeningHours } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './StudyRights.module.css'

type PartialOpeningHours = Pick<OpeningHours, 'day' | 'openHour' | 'closeHour' | 'isHoliday'>
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
    async function setStudySiteData() {
      if (studySite && studySite !== 'all') {
        const studySiteRes = await getStudySite(studySite)

        if (studySiteRes.success && studySiteRes.data) {
          const newSiteData = studySiteRes.data
          setSiteData(newSiteData)

          form.reset({
            openingHours: openingHoursToObject(newSiteData.openingHours, true),
            openingHoursHoliday: openingHoursToObject(newSiteData.openingHours, false),
            numberOfOpenDays: newSiteData.numberOfOpenDays ?? 0,
            numberOfSessions: newSiteData.numberOfSessions ?? 0,
            numberOfTickets: newSiteData.numberOfTickets ?? 0,
          })
        }
      }
    }

    setStudySiteData()
  }, [studySite])

  const openingHoursToObject = (openingHoursArr: PartialOpeningHours[], handleNormalDays: boolean) => {
    const formattedOpeningHours = openingHoursArr.reduce(
      (acc: Record<DayOfWeek, PartialOpeningHours>, openingHour) => {
        if (openingHour.isHoliday !== handleNormalDays) {
          acc[openingHour.day] = {
            ...openingHour,
            openHour: openingHour.openHour ?? '',
            closeHour: openingHour.closeHour ?? '',
          }
        }
        return acc
      },
      {} as Record<DayOfWeek, PartialOpeningHours>,
    )

    if (handleNormalDays) {
      for (const day of Object.values(DayOfWeek)) {
        if (!(day in formattedOpeningHours)) {
          formattedOpeningHours[day] = {
            day,
            openHour: '',
            closeHour: '',
            isHoliday: false,
          }
        }
      }
    }

    return formattedOpeningHours
  }

  const form = useForm<ChangeStudyCinemaCommand>({
    resolver: zodResolver(ChangeStudyCinemaValidation),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      openingHours: openingHoursToObject(siteData?.openingHours ?? [], true),
      openingHoursHoliday: openingHoursToObject(siteData?.openingHours ?? [], false),
      numberOfOpenDays: siteData?.numberOfOpenDays ?? 0,
      numberOfSessions: siteData?.numberOfSessions ?? 0,
      numberOfTickets: siteData?.numberOfTickets ?? 0,
    },
  })

  const openingHours = form.watch('openingHours')
  const openingHoursHoliday = form.watch('openingHoursHoliday')

  const daysHoliday: DayOfWeek[] = useMemo(
    () => Object.keys(openingHoursHoliday || {}) as DayOfWeek[],
    [openingHoursHoliday],
  )

  const handleStudyCinemaUpdate = useCallback(
    async (data: ChangeStudyCinemaCommand) => {
      await callServerFunction(() => changeStudyCinema(studySite, data))
    },
    [callServerFunction, studySite],
  )

  const onStudyCinemaUpdate = useCallback(() => {
    if (studySite === 'all') {
      return
    }

    form.handleSubmit(handleStudyCinemaUpdate, (e) => console.log('invalid', e))()
  }, [form, handleStudyCinemaUpdate, studySite])

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
    onStudyCinemaUpdate()
    // This effect is used to update the study cinema whenever the opening hours or holiday opening hours change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            onBlur={onStudyCinemaUpdate}
          />
          <FormTextField
            control={form.control}
            name="numberOfTickets"
            data-testid="new-study-number-of-tickets"
            label={t('numberOfTickets')}
            translation={t}
            type="number"
            className={styles.formTextField}
            onBlur={onStudyCinemaUpdate}
          />
          <FormTextField
            control={form.control}
            name="numberOfOpenDays"
            data-testid="new-study-number-of-open-days"
            label={t('numberOfOpenDays')}
            translation={t}
            type="number"
            className={styles.formTextField}
            onBlur={onStudyCinemaUpdate}
          />
        </div>
      </Block>
      <Block title={t('openingHours')}>
        <div className={classNames(styles.openingHoursContainer, 'flex-col')}>
          <WeekScheduleForm
            label={t('openingHours')}
            days={Object.values(DayOfWeek)}
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
