'use client'

import Block from '@/components/base/Block'
import LinkButton from '@/components/base/LinkButton'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import type { FullStudy } from '@/db/study'
import { changeStudyCinema, getStudySite } from '@/services/serverFunctions/study'
import { ChangeStudyCinemaCommand, ChangeStudyCinemaValidation } from '@/services/serverFunctions/study.command'
import { FormTextField } from '@abc-transitionbascarbone/components/src/form/TextField'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import type { OpeningHours } from '@abc-transitionbascarbone/db-common'
import { DayOfWeek } from '@abc-transitionbascarbone/db-common/enums'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, CircularProgress } from '@mui/material'
import { FormTextField } from '@abc-transitionbascarbone/components/src/form/TextField'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './StudyRights.module.css'

type PartialOpeningHours = Pick<OpeningHours, 'day' | 'openHour' | 'closeHour' | 'isHoliday'>

interface Props {
  study: FullStudy
}

const StudyRightsCut = ({ study }: Props) => {
  const t = useTranslations('study.new')
  const tRights = useTranslations('study.rights')
  const { callServerFunction } = useServerFunction()
  const { siteId, studySiteId, setSite } = useStudySite(study)
  const [siteData, setSiteData] = useState<FullStudy['sites'][0] | undefined>()
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    async function setStudySiteData() {
      setLoading(true)
      if (siteId && siteId !== 'all') {
        const studySiteRes = await getStudySite(studySiteId)

        if (studySiteRes.success && studySiteRes.data) {
          const newSiteData = studySiteRes.data
          setSiteData(newSiteData)

          form.reset({
            openingHours: openingHoursToObject(newSiteData.openingHours, true),
            openingHoursHoliday: openingHoursToObject(newSiteData.openingHours, false),
            numberOfOpenDays: newSiteData.numberOfOpenDays ?? 0,
            numberOfSessions: newSiteData.numberOfSessions ?? 0,
            numberOfTickets: newSiteData.numberOfTickets ?? 0,
            numberOfProgrammedFilms: newSiteData.site.cnc?.numberOfProgrammedFilms ?? 0,
          })
        }
      }
      setLoading(false)
    }

    setStudySiteData()
  }, [form, siteId, studySiteId])

  const openingHours = form.watch('openingHours')
  const openingHoursHoliday = form.watch('openingHoursHoliday')

  const handleStudyCinemaUpdate = useCallback(
    async (data: ChangeStudyCinemaCommand) => {
      const cncId = siteData?.site.cnc?.id
      if (cncId) {
        await callServerFunction(() => changeStudyCinema(studySiteId, cncId, data))
      }
    },
    [callServerFunction, siteData?.site.cnc?.id, studySiteId],
  )

  const onStudyCinemaUpdate = useCallback(() => {
    if (siteId === 'all') {
      return
    }

    form.handleSubmit(handleStudyCinemaUpdate, (e) => console.log('invalid', e))()
  }, [form, handleStudyCinemaUpdate, siteId])

  useEffect(() => {
    onStudyCinemaUpdate()
    // This effect is used to update the study cinema whenever the opening hours or holiday opening hours change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(openingHours), JSON.stringify(openingHoursHoliday)])

  return (
    <>
      <Block
        title={tRights('general')}
        rightComponent={
          <SelectStudySite sites={study.sites} defaultValue={siteId} setSite={setSite} showAllOption={false} />
        }
      >
        {loading ? (
          <CircularProgress variant="indeterminate" color="primary" size={100} className="flex mt2" />
        ) : (
          <>
            <div className="my2">{t('cncInfo', { year: siteData?.cncVersion?.year ?? 2023 })}</div>
            <div className="flex-col gapped1">
              <FormTextField
                control={form.control}
                name="numberOfSessions"
                data-testid="new-study-number-of-sessions"
                label={t('numberOfSessions')}
                type="number"
                className={styles.formTextField}
                onBlur={onStudyCinemaUpdate}
              />
              <FormTextField
                control={form.control}
                name="numberOfTickets"
                data-testid="new-study-number-of-tickets"
                label={t('numberOfTickets')}
                type="number"
                className={styles.formTextField}
                onBlur={onStudyCinemaUpdate}
              />
              <FormTextField
                control={form.control}
                name="numberOfOpenDays"
                data-testid="new-study-number-of-open-days"
                label={t('numberOfOpenDays')}
                type="number"
                className={styles.formTextField}
                onBlur={onStudyCinemaUpdate}
              />
              <FormTextField
                control={form.control}
                name="numberOfProgrammedFilms"
                data-testid="new-study-number-of-programmed-films"
                label={t('numberOfProgrammedFilms')}
                type="number"
                className={styles.formTextField}
                onBlur={onStudyCinemaUpdate}
              />
            </div>
            <Box className="flex justify-start mt1">
              <LinkButton
                color="primary"
                variant="contained"
                href={`/etudes/${study.id}/comptabilisation/saisie-des-donnees`}
              >
                {t('goToDataEntry')}
              </LinkButton>
            </Box>
          </>
        )}
      </Block>
    </>
  )
}

export default StudyRightsCut
