'use client'

import Block from '@/components/base/Block'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormTextField } from '@/components/form/TextField'
import StudySites from '@/components/study/perimeter/StudySites'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import { SiteDependentField } from '@/constants/emissionFactorMap'
import { OrganizationWithSites } from '@/db/account'
import type { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  CustomDataFields,
  mappedTiltSituationToCustomDataFields,
  TiltStructureOptions,
} from '@/services/customDataToSituation'
import { loadMappedSituation } from '@/services/serverFunctions/situation'
import { changeStudyDates, changeStudySiteTiltSimplified } from '@/services/serverFunctions/study'
import {
  ChangeStudyDatesCommand,
  ChangeStudyDatesCommandValidation,
  ChangeStudySiteTiltSimplifiedCommand,
  ChangeStudySiteTiltSimplifiedValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircularProgress } from '@mui/material'
import { SiteCAUnit, StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './StudyRightsTiltSimplified.module.css'
import GlossaryModal from '@/components/modals/GlossaryModal'
import HelpIcon from '@/components/base/HelpIcon'

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
  const tStructure = useTranslations('study.structure')
  const tGlossary = useTranslations('study.new.glossary')
  const { callServerFunction } = useServerFunction()
  const { studySite, setSite } = useStudySite(study)
  const [glossary, setGlossary] = useState('')
  const [siteData, setSiteData] = useState<CustomDataFields | undefined>()
  const [loading, setLoading] = useState(true)
  const [showSiteDataWarning, setShowSiteDataWarning] = useState(false)
  const [pendingSiteChanges, setPendingSiteChanges] = useState<{
    changedFields: SiteDependentField[]
    questionsBySubPost: Record<string, Array<{ id: string; label: string; idIntern: string; answer?: string }>>
    pendingData: ChangeStudySiteTiltSimplifiedCommand
  } | null>(null)
  const [originalValues, setOriginalValues] = useState<{
    postalCode: string
    structure: string
    numberOfTTVolunteer: number
    numberOfTTEmployee: number
  } | null>(null)

  const form = useForm<ChangeStudySiteTiltSimplifiedCommand>({
    resolver: zodResolver(ChangeStudySiteTiltSimplifiedValidation),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      postalCode: siteData?.postalCode ?? '',
      structure: siteData?.structure ?? '',
      numberOfTTVolunteer: siteData?.numberOfTTVolunteer ?? 0,
      numberOfTTEmployee: siteData?.numberOfTTEmployee ?? 0,
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
    async function setStudySiteData() {
      setLoading(true)
      if (studySite && studySite !== 'all') {
        const situationRes = await loadMappedSituation(study.id, studySite, mappedTiltSituationToCustomDataFields)

        if (situationRes.success && situationRes.data) {
          const newSiteData = situationRes.data
          setSiteData(newSiteData)

          const initialValues = {
            postalCode: String(newSiteData?.postalCode ?? ''),
            structure: String(newSiteData?.structure ?? ''),
            numberOfTTVolunteer: Number(newSiteData?.numberOfTTVolunteer ?? 0),
            numberOfTTEmployee: Number(newSiteData?.numberOfTTEmployee ?? 0),
          }

          // Store original values for change detection
          setOriginalValues(initialValues)

          form.reset(initialValues)
        }
      }
      setLoading(false)
    }

    setStudySiteData()
  }, [form, studySite])

  const handleStudySiteUpdate = useCallback(
    async (data: ChangeStudySiteTiltSimplifiedCommand) => {
      await callServerFunction(() => changeStudySiteTiltSimplified(studySite, data))
      setOriginalValues({
        postalCode: data.postalCode ?? '',
        structure: data.structure ?? '',
        numberOfTTVolunteer: data.numberOfTTVolunteer ?? 0,
        numberOfTTEmployee: data.numberOfTTEmployee ?? 0,
      })
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
      await callServerFunction(() => changeStudySiteTiltSimplified(studySite, pendingSiteChanges.pendingData))
      setOriginalValues({
        postalCode: pendingSiteChanges.pendingData.postalCode ?? '',
        structure: pendingSiteChanges.pendingData.structure ?? '',
        numberOfTTVolunteer: pendingSiteChanges.pendingData.numberOfTTVolunteer ?? 0,
        numberOfTTEmployee: pendingSiteChanges.pendingData.numberOfTTEmployee ?? 0,
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

  const onStudySiteUpdate = useCallback(() => {
    if (studySite === 'all') {
      return
    }

    form.handleSubmit(handleStudySiteUpdate, (e) => console.log('invalid', e))()
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
            <div className="flex-col gapped1 mb1">
              <FormTextField
                control={form.control}
                name="postalCode"
                data-testid="new-study-postal-code"
            label={
              <span className="align-center text-center">
                {t('postalCode')}
                <HelpIcon
                  className="ml-4 pointer"
                  onClick={() => setGlossary("postalCode")}
                  label={tGlossary('title')}
                />
              </span>
            }
                className={styles.formTextField}
                onBlur={onStudySiteUpdate}
              />
              {!!organizationVersion && (
                <StudySites
                  study={study}
                  caUnit={caUnit}
                  user={user}
                  userRoleOnStudy={userRoleOnStudy}
                  organizationVersion={organizationVersion}
                />
              )}
              <FormAutocomplete
                control={form.control}
                translation={t}
                name="structure"
                label={t('structure')}
                data-testid="new-study-structure"
                options={TiltStructureOptions.map((structure) => ({
                  label: tStructure(structure),
                  value: structure,
                }))}
                renderValue={(structure) => (structure ? tStructure(structure as string) : '')}
                onBlur={onStudySiteUpdate}
              />
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
              <FormTextField
                control={form.control}
                name="numberOfTTVolunteer"
                data-testid="new-study-number-of-tt-volunteers"
                label={t('numberOfTTVolunteer')}
                type="number"
                className={styles.formTextField}
                onBlur={onStudySiteUpdate}
              />
              <FormTextField
                control={form.control}
                name="numberOfTTEmployee"
                data-testid="new-study-number-of-tt-employees"
                label={t('numberOfTTEmployee')}
                type="number"
                className={styles.formTextField}
                onBlur={onStudySiteUpdate}
              />
            </div>
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
      {glossary && (
        <GlossaryModal glossary={glossary} onClose={() => setGlossary('')} label="emission-source" t={tGlossary}>
          <p className="mb-2">{tGlossary(`${glossary}Glossary`)}</p>
        </GlossaryModal>
      )}
    </>
  )
}

export default StudyRightsTiltSimplified
