'use client'

import Block from '@/components/base/Block'
import { FormDatePicker } from '@/components/form/DatePicker'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import { SiteDependentField } from '@/constants/emissionFactorMap'
import type { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { changeStudyDates, getStudySite } from '@/services/serverFunctions/study'
import {
  ChangeStudyDatesCommand,
  ChangeStudyDatesCommandValidation,
  ChangeStudySitesCommand,
  ChangeStudySitesCommandValidation,
  ChangeStudySiteTiltSimplifiedCommand,
  ChangeStudySiteTiltSimplifiedValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircularProgress } from '@mui/material'
import { SiteCAUnit, StudyRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Sites from '../organization/Sites'
import styles from './StudyRightsTiltSimplified.module.css'
import StudySites from '@/components/study/perimeter/StudySites'
import { UserSession } from 'next-auth'
import { OrganizationWithSites } from '@/db/account'

const SiteDataChangeWarningModal = dynamic(() => import('@/components/modals/SiteDataChangeWarningModal'), {
  ssr: false,
})

interface Props {
  study: FullStudy
  caUnit: SiteCAUnit
  user: UserSession
  userRoleOnStudy: StudyRole
  organizationVersion: OrganizationWithSites | null
}

const StudyRightsTiltSimplified = ({ study, caUnit, user, userRoleOnStudy, organizationVersion }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.new')
  const tRights = useTranslations('study.rights')
  const tValidation = useTranslations('validation')
  const tLabel = useTranslations('common.label')
  const { callServerFunction } = useServerFunction()
  const { studySite, setSite } = useStudySite(study)
  const [siteData, setSiteData] = useState<FullStudy['sites'][0] | undefined>()
  const [loading, setLoading] = useState(true)
  const [showSiteDataWarning, setShowSiteDataWarning] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [pendingSiteChanges, setPendingSiteChanges] = useState<{
    changedFields: SiteDependentField[]
    questionsBySubPost: Record<string, Array<{ id: string; label: string; idIntern: string; answer?: string }>>
    pendingData: ChangeStudySiteTiltSimplifiedCommand
  } | null>(null)
  const [originalValues, setOriginalValues] = useState<{
    postalCode: string
    sites: string[]
    structure: string
    numberOfTTVolunteer: number
    numberOfTTEmployee: number
  } | null>(null)

  const form = useForm<ChangeStudySiteTiltSimplifiedCommand>({
    resolver: zodResolver(ChangeStudySiteTiltSimplifiedValidation),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      // numberOfOpenDays: siteData?.numberOfOpenDays ?? 0,
      // numberOfSessions: siteData?.numberOfSessions ?? 0,
      // numberOfTickets: siteData?.numberOfTickets ?? 0,
    },
  })

  const dateForm = useForm<ChangeStudyDatesCommand>({
    resolver: zodResolver(ChangeStudyDatesCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      startDate: study.startDate.toISOString(),
      endDate: study.endDate.toISOString(),
    },
  })

  const siteForm = useForm<ChangeStudySitesCommand>({
    resolver: zodResolver(ChangeStudySitesCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      organizationId: study.organizationVersion.organization.id,
      sites: [],
    },
  })

  const sites = siteForm.watch('sites')

  useEffect(() => {
    async function setStudySiteData() {
      setLoading(true)
      if (studySite && studySite !== 'all') {
        const studySiteRes = await getStudySite(studySite)

        if (studySiteRes.success && studySiteRes.data) {
          const newSiteData = studySiteRes.data
          setSiteData(newSiteData)

          const initialValues = {
            // numberOfOpenDays: newSiteData.numberOfOpenDays ?? 0,
            // numberOfSessions: newSiteData.numberOfSessions ?? 0,
            // numberOfTickets: newSiteData.numberOfTickets ?? 0,
            // numberOfProgrammedFilms: newSiteData.site.cnc?.numberOfProgrammedFilms ?? 0,
          }

          // Store original values for change detection
          // setOriginalValues(initialValues)

          form.reset({
            ...initialValues,
          })
        }
      }
      setLoading(false)
    }

    setStudySiteData()
  }, [form, studySite])

  const handleStudySiteUpdate = useCallback(
    async (data: ChangeStudySiteTiltSimplifiedCommand) => {
      // await callServerFunction(() => changeStudyEstablishment(studySite, data))
      // setOriginalValues({
      // etp: data.etp ?? 0,
      // studentNumber: data.studentNumber ?? 0,
      // superficy: data.superficy ?? null,
      // country: data.country ?? null,
      // })
    },
    [callServerFunction, originalValues, studySite],
  )

  const handleSiteDataWarningCancel = () => {
    setShowSiteDataWarning(false)
    setPendingSiteChanges(null)
    if (originalValues && siteData) {
      form.reset(originalValues)
    }
  }

  const handleSiteDataWarningConfirm = async () => {
    if (pendingSiteChanges) {
      setShowSiteDataWarning(false)
      // await callServerFunction(() => changeStudyEstablishment(studySite, pendingSiteChanges.pendingData))
      // setOriginalValues({
      //   etp: pendingSiteChanges.pendingData.etp ?? 0,
      //   studentNumber: pendingSiteChanges.pendingData.studentNumber ?? 0,
      //   superficy: pendingSiteChanges.pendingData.superficy ?? null,
      //   country: pendingSiteChanges.pendingData.country ?? null,
      // })
      setPendingSiteChanges(null)
    }
  }

  const handleDateChange = useCallback(async () => {
    const isValid = await dateForm.trigger()
    if (isValid) {
      const values = dateForm.getValues()
      await callServerFunction(() => changeStudyDates(values), {
        onSuccess: () => {
          router.refresh()
        },
        onError: () => {
          router.refresh()

          dateForm.reset({
            studyId: study.id,
            startDate: study.startDate.toISOString(),
            endDate: study.endDate.toISOString(),
          })
        },
        getErrorMessage: (errorMessage: string) => tValidation(errorMessage),
      })
    }
  }, [dateForm, callServerFunction, router, tValidation, study])

  const onStudySiteUpdate = useCallback(() => {
    if (studySite === 'all') {
      return
    }

    // form.handleSubmit(handleStudyCinemaUpdate, (e) => console.log('invalid', e))()
  }, [form, handleStudySiteUpdate, studySite])

  return (
    <>
      <Block
        title={tRights('general')}
        rightComponent={
          <SelectStudySite sites={study.sites} defaultValue={studySite} setSite={setSite} showAllOption={false} />
        }
      >
        {loading ? (
          <CircularProgress variant="indeterminate" color="primary" size={100} className="flex mt2" />
        ) : (
          <>
            {!!organizationVersion && (
              <StudySites  study={study} caUnit={caUnit} user={user} userRoleOnStudy={userRoleOnStudy} organizationVersion={organizationVersion}/>
            )}
            <div className="flex-col gapped1 mb1">
              <div className={styles.dates}>
                <FormDatePicker
                  control={dateForm.control}
                  name="startDate"
                  label={tLabel('start')}
                  onAccept={handleDateChange}
                />
                <FormDatePicker
                  control={dateForm.control}
                  name="endDate"
                  label={tLabel('end')}
                  data-testid="new-study-endDate"
                  onAccept={handleDateChange}
                />
              </div>
            </div>
            {/* <div className="flex-col gapped1">
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
              /> */}
            {/* </div> */}
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
      </Block>
    </>
  )
}

export default StudyRightsTiltSimplified
