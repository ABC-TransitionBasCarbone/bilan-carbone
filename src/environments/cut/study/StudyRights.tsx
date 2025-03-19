'use client'

import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import WeekScheduleForm from '@/components/form/WeekScheduleForm'
import StudyContributorsTable from '@/components/study/rights/StudyContributorsTable'
import StudyParams from '@/components/study/rights/StudyParams'
import StudyRightsTable from '@/components/study/rights/StudyRightsTable'
import { FullStudy } from '@/db/study'
import { changeStudyOpeningHours } from '@/services/serverFunctions/study'
import {
  ChangeStudyOpeningHoursCommand,
  ChangeStudyOpeningHoursValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { DayOfWeek, OpeningHours, StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './StudyRights.module.css'

interface Props {
  user: User
  study: FullStudy
  editionDisabled: boolean
  userRoleOnStudy: StudyRole
}

const StudyRights = ({ user, study, editionDisabled, userRoleOnStudy }: Props) => {
  const t = useTranslations('study.new')
  const tEdit = useTranslations('study.rights.hours')

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

  const form = useForm<ChangeStudyOpeningHoursCommand>({
    resolver: zodResolver(ChangeStudyOpeningHoursValidation),
    defaultValues: {
      studyId: study.id,
      openingHours: openingHoursToObject(study.openingHours),
      openingHoursHoliday: openingHoursToObject(study.openingHours, true),
    },
  })

  const openingHours = form.watch('openingHours')
  const openingHoursHoliday = form.watch('openingHoursHoliday')

  const days: DayOfWeek[] = useMemo(() => Object.keys(openingHours || {}) as DayOfWeek[], [openingHours])
  const daysHoliday: DayOfWeek[] = useMemo(
    () => Object.keys(openingHoursHoliday || {}) as DayOfWeek[],
    [openingHoursHoliday],
  )

  const [isEditingHours, setIsEditingHours] = useState(false)
  const [error, setError] = useState('')

  const cancelOrEditStudyOpeningHours = () => {
    if (!isEditingHours) {
      setIsEditingHours(true)
      return
    }

    setIsEditingHours(false)

    form.setValue('openingHours', openingHoursToObject(study.openingHours))
    form.setValue('openingHoursHoliday', openingHoursToObject(study.openingHours, true))
  }

  const onOpeningHoursSubmit = useCallback(
    form.handleSubmit(async (data) => {
      const result = await changeStudyOpeningHours(data)
      if (result) {
        setError(result)
        return
      }
      setIsEditingHours(false)
    }),
    [openingHours, openingHoursHoliday, study, form],
  )

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

  return (
    <>
      <StudyParams user={user} study={study} disabled={editionDisabled} />
      <Block title={t('openingHours')}>
        <div className={styles.openingHoursContainer}>
          <WeekScheduleForm
            label={t('openingHours')}
            days={days}
            name={'openingHours'}
            control={form.control}
            disabled={editionDisabled || !isEditingHours}
            onCheckDay={handleCheckDay}
            isChecked={isChecked}
          />
          <WeekScheduleForm
            label={t('openingHoursHoliday')}
            days={daysHoliday}
            name={'openingHoursHoliday'}
            control={form.control}
            disabled={editionDisabled || !isEditingHours}
          />
        </div>
        <div className={classNames('mt1', { 'justify-between': isEditingHours })}>
          <Button
            data-testid={`${isEditingHours ? 'cancel-' : ''}edit-study-opening-hours`}
            onClick={cancelOrEditStudyOpeningHours}
          >
            {tEdit(isEditingHours ? 'cancelEditOpeningHours' : 'editOpeningHours')}
          </Button>
          {isEditingHours && (
            <Button data-testid="confirm-edit-study-opening-hours" onClick={onOpeningHoursSubmit}>
              {tEdit('validOpeningHours')}
            </Button>
          )}
          {error && <p>{error}</p>}
        </div>
      </Block>
      <StudyRightsTable study={study} user={user} canAddMember={!editionDisabled} userRoleOnStudy={userRoleOnStudy} />
      <StudyContributorsTable study={study} canAddContributor={!editionDisabled} />
    </>
  )
}

export default StudyRights
