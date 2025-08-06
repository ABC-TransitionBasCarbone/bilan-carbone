'use client'

import Block from '@/components/base/Block'
import LinkButton from '@/components/base/LinkButton'
import { FormTextField } from '@/components/form/TextField'
import WeekScheduleForm from '@/components/form/WeekScheduleForm'
import StudyParams from '@/components/study/rights/StudyParams'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import {
  getQuestionsAffectedBySiteDataChange,
  SITE_DEPENDENT_FIELDS,
  SiteDependentField,
} from '@/constants/emissionFactorMap'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { changeStudyCinema, getQuestionsGroupedBySubPost, getStudySite } from '@/services/serverFunctions/study'
import { ChangeStudyCinemaCommand, ChangeStudyCinemaValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, CircularProgress } from '@mui/material'
import { DayOfWeek, EmissionFactorImportVersion, OpeningHours } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './StudyRights.module.css'

const SiteDataChangeWarningModal = dynamic(() => import('@/components/modals/SiteDataChangeWarningModal'), {
  ssr: false,
})

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
  const [loading, setLoading] = useState(true)
  const [showSiteDataWarning, setShowSiteDataWarning] = useState(false)
  const [pendingSiteChanges, setPendingSiteChanges] = useState<{
    changedFields: SiteDependentField[]
    questionsBySubPost: Record<string, Array<{ id: string; label: string; idIntern: string; answer?: string }>>
    pendingData: ChangeStudyCinemaCommand
  } | null>(null)
  const [originalValues, setOriginalValues] = useState<{
    numberOfSessions: number
    numberOfTickets: number
    numberOfOpenDays: number
    distanceToParis: number
    numberOfProgrammedFilms: number
  } | null>(null)

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
      distanceToParis: siteData?.distanceToParis ?? 0,
    },
  })

  useEffect(() => {
    async function setStudySiteData() {
      setLoading(true)
      if (studySite && studySite !== 'all') {
        const studySiteRes = await getStudySite(studySite)

        if (studySiteRes.success && studySiteRes.data) {
          const newSiteData = studySiteRes.data
          setSiteData(newSiteData)

          const initialValues = {
            numberOfOpenDays: newSiteData.numberOfOpenDays ?? 0,
            numberOfSessions: newSiteData.numberOfSessions ?? 0,
            numberOfTickets: newSiteData.numberOfTickets ?? 0,
            distanceToParis: newSiteData.distanceToParis ?? 0,
            numberOfProgrammedFilms: newSiteData.site.cnc?.numberOfProgrammedFilms ?? 0,
          }

          // Store original values for change detection
          setOriginalValues(initialValues)

          form.reset({
            openingHours: openingHoursToObject(newSiteData.openingHours, true),
            openingHoursHoliday: openingHoursToObject(newSiteData.openingHours, false),
            ...initialValues,
          })
        }
      }
      setLoading(false)
    }

    setStudySiteData()
  }, [form, studySite])

  const openingHours = form.watch('openingHours')
  const openingHoursHoliday = form.watch('openingHoursHoliday')

  const daysHoliday: DayOfWeek[] = useMemo(
    () => Object.keys(openingHoursHoliday || {}) as DayOfWeek[],
    [openingHoursHoliday],
  )

  const handleStudyCinemaUpdate = useCallback(
    async (data: ChangeStudyCinemaCommand) => {
      const cncId = siteData?.site.cnc?.id
      if (cncId) {
        if (originalValues) {
          // Check for changes in fields that could affect emissions
          const changedFields: SiteDependentField[] = []
          for (const field of SITE_DEPENDENT_FIELDS) {
            if ((data[field] ?? 0) !== originalValues[field]) {
              changedFields.push(field)
            }
          }

          if (changedFields.length > 0) {
            const affectedQuestionIds = getQuestionsAffectedBySiteDataChange(changedFields)
            if (affectedQuestionIds.length > 0) {
              const questionsBySubPostResponse = await getQuestionsGroupedBySubPost(affectedQuestionIds, studySite)
              const questionsBySubPost = questionsBySubPostResponse.success ? questionsBySubPostResponse.data : {}

              const hasAnswers = Object.values(questionsBySubPost).some((questions) =>
                questions.some((question) => question.answer && question.answer.trim() !== ''),
              )

              if (hasAnswers) {
                setPendingSiteChanges({
                  changedFields,
                  questionsBySubPost,
                  pendingData: data,
                })
                setShowSiteDataWarning(true)
                return
              }
            }
          }
        }

        await callServerFunction(() => changeStudyCinema(studySite, cncId, data))
        setOriginalValues({
          numberOfSessions: data.numberOfSessions ?? 0,
          numberOfTickets: data.numberOfTickets ?? 0,
          numberOfOpenDays: data.numberOfOpenDays ?? 0,
          distanceToParis: data.distanceToParis ?? 0,
          numberOfProgrammedFilms: data.numberOfProgrammedFilms ?? 0,
        })
      }
    },
    [callServerFunction, originalValues, siteData?.site.cnc?.id, studySite],
  )

  const handleSiteDataWarningCancel = () => {
    setShowSiteDataWarning(false)
    setPendingSiteChanges(null)
    if (originalValues && siteData) {
      form.reset({
        numberOfSessions: originalValues.numberOfSessions,
        numberOfTickets: originalValues.numberOfTickets,
        numberOfOpenDays: originalValues.numberOfOpenDays,
        distanceToParis: originalValues.distanceToParis,
        numberOfProgrammedFilms: originalValues.numberOfProgrammedFilms,
      })
    }
  }

  const handleSiteDataWarningConfirm = async () => {
    if (pendingSiteChanges) {
      setShowSiteDataWarning(false)
      const cncId = siteData?.site.cnc?.id
      if (cncId) {
        await callServerFunction(() => changeStudyCinema(studySite, cncId, pendingSiteChanges.pendingData))
        setOriginalValues({
          numberOfSessions: pendingSiteChanges.pendingData.numberOfSessions ?? 0,
          numberOfTickets: pendingSiteChanges.pendingData.numberOfTickets ?? 0,
          numberOfOpenDays: pendingSiteChanges.pendingData.numberOfOpenDays ?? 0,
          distanceToParis: pendingSiteChanges.pendingData.distanceToParis ?? 0,
          numberOfProgrammedFilms: pendingSiteChanges.pendingData.numberOfProgrammedFilms ?? 0,
        })
        setPendingSiteChanges(null)
      }
    }
  }

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

  const labelWithYear = (label: string) => t(label, { year: study.startDate.getFullYear() })

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
      </Block>
      {loading ? (
        <Block>
          <CircularProgress variant="indeterminate" color="primary" size={100} />
        </Block>
      ) : (
        <>
          <Block>
            <div>
              <FormTextField
                control={form.control}
                name="numberOfSessions"
                data-testid="new-study-number-of-sessions"
                label={labelWithYear('numberOfSessions')}
                translation={t}
                type="number"
                className={styles.formTextField}
                onBlur={onStudyCinemaUpdate}
              />
              <FormTextField
                control={form.control}
                name="numberOfTickets"
                data-testid="new-study-number-of-tickets"
                label={labelWithYear('numberOfTickets')}
                translation={t}
                type="number"
                className={styles.formTextField}
                onBlur={onStudyCinemaUpdate}
              />
              <FormTextField
                control={form.control}
                name="numberOfOpenDays"
                data-testid="new-study-number-of-open-days"
                label={labelWithYear('numberOfOpenDays')}
                translation={t}
                type="number"
                className={styles.formTextField}
                onBlur={onStudyCinemaUpdate}
              />
              <FormTextField
                control={form.control}
                name="distanceToParis"
                data-testid="new-study-distance-to-paris"
                label={t('distanceToParis')}
                translation={t}
                type="number"
                className={styles.formTextField}
                onBlur={onStudyCinemaUpdate}
              />
              <FormTextField
                control={form.control}
                name="numberOfProgrammedFilms"
                data-testid="new-study-number-of-programmed-films"
                label={labelWithYear('numberOfProgrammedFilms')}
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
            <Box className={classNames('flex', 'justify-end')}>
              <LinkButton
                color="primary"
                variant="contained"
                href={`/etudes/${study.id}/comptabilisation/saisie-des-donnees`}
              >
                Suivant
              </LinkButton>
            </Box>
          </Block>
        </>
      )}
      {showSiteDataWarning && pendingSiteChanges && (
        <SiteDataChangeWarningModal
          isOpen={showSiteDataWarning}
          onClose={handleSiteDataWarningCancel}
          onConfirm={handleSiteDataWarningConfirm}
          questionsBySubPost={pendingSiteChanges.questionsBySubPost}
        />
      )}
    </>
  )
}

export default StudyRights
