'use client'

import Block from '@/components/base/Block'
import LinkButton from '@/components/base/LinkButton'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormTextField } from '@/components/form/TextField'
import Modal from '@/components/modals/Modal'
import StudyContributorsTable from '@/components/study/rights/StudyContributorsTable'
import StudyVersions from '@/components/study/rights/StudyVersions'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import StudyComments from '@/components/study/StudyComments'
import { SiteDependentField } from '@/constants/emissionFactorMap'
import type { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { changeStudyDates, changeStudyEstablishment, changeStudyName, getStudySite } from '@/services/serverFunctions/study'
import {
  ChangeStudyDatesCommand,
  ChangeStudyDatesCommandValidation,
  ChangeStudyEstablishmentCommand,
  ChangeStudyEstablishmentValidation,
  ChangeStudyNameCommand,
  ChangeStudyNameValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import EditIcon from '@mui/icons-material/Edit'
import { Box, CircularProgress } from '@mui/material'
import type { EmissionFactorImportVersion } from '@repo/db-common'
import { Country } from '@repo/db-common/enums'
import { Button } from '@repo/ui'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './StudyRights.module.css'

const SiteDataChangeWarningModal = dynamic(() => import('@/components/modals/SiteDataChangeWarningModal'), {
  ssr: false,
})

interface Props {
  study: FullStudy
  editionDisabled: boolean
  emissionFactorSources: EmissionFactorImportVersion[]
  user: UserSession
}

const StudyRightsClickson = ({ study, editionDisabled, emissionFactorSources, user }: Props) => {
  const tLabel = useTranslations('common.label')
  const t = useTranslations('study.new')
  const tRights = useTranslations('study.rights')
  const tValidation = useTranslations('validation')
  const tCountry = useTranslations('country')
  const { callServerFunction } = useServerFunction()
  const { siteId: studySite, studySiteId, setSite } = useStudySite(study)
  const [siteData, setSiteData] = useState<FullStudy['sites'][0] | undefined>()
  const [loading, setLoading] = useState(true)
  const [editTitle, setEditTitle] = useState(false)
  const [loadingStudyName, setLoadingStudyName] = useState(false)
  const [showSiteDataWarning, setShowSiteDataWarning] = useState(false)
  const [pendingSiteChanges, setPendingSiteChanges] = useState<{
    changedFields: SiteDependentField[]
    questionsBySubPost: Record<string, Array<{ id: string; label: string; idIntern: string; answer?: string }>>
    pendingData: ChangeStudyEstablishmentCommand
  } | null>(null)
  const [originalValues, setOriginalValues] = useState<{
    etp: number
    studentNumber: number
    superficy: number | null
    country: Country | null
  } | null>(null)

  const router = useRouter()

  const form = useForm<ChangeStudyEstablishmentCommand>({
    resolver: zodResolver(ChangeStudyEstablishmentValidation),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      etp: siteData?.etp ?? siteData?.site.etp ?? 0,
      studentNumber: siteData?.studentNumber ?? siteData?.site.studentNumber ?? 0,
      superficy: siteData?.superficy ?? siteData?.site.superficy ?? null,
    },
  })
  const nameForm = useForm<ChangeStudyNameCommand>({
    resolver: zodResolver(ChangeStudyNameValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      name: study.name,
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
  useEffect(() => {
    setLoading(true)
    const currentYear = new Date().getFullYear()
    // + 1 because january = 0
    const currentMonth = new Date().getMonth() + 1
    const startYear = currentMonth >= 9 ? currentYear : currentYear - 1
    dateForm.setValue('studyId', study.id)
    dateForm.setValue('startDate', study.startDate.toISOString() ?? new Date(`${startYear}-09-01`).toISOString())
    dateForm.setValue('endDate', study.endDate.toISOString() ?? new Date(`${startYear + 1}-08-31`).toISOString())
    setLoading(false)
  }, [dateForm, study])

  useEffect(() => {
    async function setStudySiteData() {
      setLoading(true)
      if (studySite && studySite !== 'all') {
        const studySiteRes = await getStudySite(studySiteId)

        if (studySiteRes.success && studySiteRes.data) {
          const newSiteData = studySiteRes.data
          setSiteData(newSiteData)

          const initialValues = {
            etp: newSiteData.etp ?? newSiteData.site.etp ?? 0,
            studentNumber: newSiteData.studentNumber ?? newSiteData.site.studentNumber ?? 0,
            superficy: newSiteData.superficy ?? newSiteData.site.superficy ?? null,
            country: newSiteData.country ?? newSiteData.site.country ?? null,
          }

          // Store original values for change detection
          setOriginalValues(initialValues)

          form.reset(initialValues)
        }
      }
      setLoading(false)
    }

    setStudySiteData()
  }, [form, studySite, studySiteId])

  const handleStudyEstablishmentUpdate = useCallback(
    async (data: ChangeStudyEstablishmentCommand) => {
      await callServerFunction(() => changeStudyEstablishment(studySiteId, data))
      setOriginalValues({
        etp: data.etp ?? 0,
        studentNumber: data.studentNumber ?? 0,
        superficy: data.superficy ?? null,
        country: data.country ?? null,
      })
    },
    [callServerFunction, studySiteId],
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
      await callServerFunction(() => changeStudyEstablishment(studySiteId, pendingSiteChanges.pendingData))
      setOriginalValues({
        etp: pendingSiteChanges.pendingData.etp ?? 0,
        studentNumber: pendingSiteChanges.pendingData.studentNumber ?? 0,
        superficy: pendingSiteChanges.pendingData.superficy ?? null,
        country: pendingSiteChanges.pendingData.country ?? null,
      })
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

  const onStudyEstablishmentUpdate = useCallback(() => {
    if (studySite === 'all') {
      return
    }

    form.handleSubmit(handleStudyEstablishmentUpdate, (e) => console.log('invalid', e))()
  }, [form, handleStudyEstablishmentUpdate, studySite])

  const resetNameInput = useCallback(() => {
    nameForm.setValue('name', study.name)
    setEditTitle(false)
  }, [nameForm, study.name])

  const handleStudyNameUpdate = useCallback(async () => {
    setLoadingStudyName(true)

    await nameForm.handleSubmit(async (data) => {
      if (data.name === study.name) {
        resetNameInput()
        return
      }

      await callServerFunction(() => changeStudyName(data), {
        onSuccess: () => {
          setEditTitle(false)
          router.refresh()
        },
      })
    })()

    setLoadingStudyName(false)
  }, [nameForm, study.name, resetNameInput, callServerFunction, router])

  return (
    <>
      <Block
        title={tRights('title', { name: study.name })}
        icon={
          editionDisabled ? null : (
            <Button aria-label={tRights('edit')} title={tRights('edit')} onClick={() => setEditTitle(true)}>
              <EditIcon />
            </Button>
          )
        }
        iconPosition="after"
        rightComponent={
          <SelectStudySite sites={study.sites} defaultValue={studySite} setSite={setSite} showAllOption={false} />
        }
      >
        {loading ? (
          <CircularProgress variant="indeterminate" color="primary" size={100} className="flex mt2" />
        ) : (
          <>
            <StudyVersions study={study} emissionFactorSources={emissionFactorSources} canUpdate={false} />
            <div className="flex-col gapped1 mb1">
              <div className={styles.dates}>
                <FormDatePicker
                  control={dateForm.control}
                  name="startDate"
                  label={tLabel('start')}
                  onAccept={handleDateChange}
                  disabled={editionDisabled}
                />
                <FormDatePicker
                  control={dateForm.control}
                  name="endDate"
                  label={tLabel('end')}
                  data-testid="new-study-endDate"
                  onAccept={handleDateChange}
                  disabled={editionDisabled}
                />
              </div>
            </div>
            <div className="flex-col gapped1">
              <FormTextField
                control={form.control}
                name="etp"
                data-testid="new-study-number-of-open-days"
                label={t('etp')}
                type="number"
                className={styles.formTextField}
                onBlur={onStudyEstablishmentUpdate}
                disabled={editionDisabled}
              />
              <FormTextField
                control={form.control}
                name="studentNumber"
                data-testid="new-study-number-of-programmed-films"
                label={t('studentNumber')}
                type="number"
                className={styles.formTextField}
                onBlur={onStudyEstablishmentUpdate}
                disabled={editionDisabled}
              />
              <FormTextField
                control={form.control}
                name="superficy"
                data-testid="new-study-number-of-programmed-films"
                label={t('superficy')}
                type="number"
                className={styles.formTextField}
                onBlur={onStudyEstablishmentUpdate}
                disabled={editionDisabled}
                placeholder={t('superficyPlaceholder')}
              />
              <FormAutocomplete
                control={form.control}
                translation={t}
                name="country"
                label={t('country')}
                data-testid="activation-country"
                options={Object.keys(Country).map((country) => ({
                  label: tCountry(country),
                  value: country,
                }))}
                renderValue={(country) => (country ? tCountry(country as Country) : '')}
                onBlur={onStudyEstablishmentUpdate}
                disabled={editionDisabled}
              />
            </div>
            <Box className="flex justify-start mt1">
              <LinkButton variant="contained" href={`/etudes/${study.id}/comptabilisation/saisie-des-donnees`}>
                {t('goToDataEntry')}
              </LinkButton>
            </Box>
          </>
        )}

        <StudyComments user={user} studyId={study.id} canValidate={!editionDisabled} />
        {showSiteDataWarning && pendingSiteChanges && (
          <SiteDataChangeWarningModal
            isOpen={showSiteDataWarning}
            onClose={handleSiteDataWarningCancel}
            onConfirm={handleSiteDataWarningConfirm}
            questionsBySubPost={pendingSiteChanges.questionsBySubPost}
          />
        )}
        {!editionDisabled && <StudyContributorsTable study={study} canAddContributor={!editionDisabled} />}
      </Block>
      <Modal
        open={editTitle}
        label="edit-study-title"
        title={tRights('edit')}
        onClose={resetNameInput}
        actions={[
          {
            actionType: 'loadingButton',
            onClick: () => handleStudyNameUpdate(),
            loading: loadingStudyName,
            children: tRights('edit'),
          },
        ]}
      >
        <FormTextField name="name" control={nameForm.control} required />
      </Modal>
    </>
  )
}

export default StudyRightsClickson
