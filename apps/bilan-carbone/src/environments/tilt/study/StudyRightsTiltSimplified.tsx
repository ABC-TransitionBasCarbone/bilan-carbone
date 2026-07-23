'use client'

import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormDatePicker } from '@/components/form/DatePicker'
import StudySites from '@/components/study/perimeter/StudySites'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import { OrganizationWithSites } from '@/db/account'
import type { FullStudy } from '@/db/study'
import { getTiltEngine } from '@/environments/tilt/publicodes/tilt-engine'
import {
  mappedTiltSituationToCustomDataFields,
  optionalTiltSituationToCustomDataFields,
  TiltCustomDataFields,
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
import { TiltStudySiteFields } from '@/services/studySiteToSituation'
import { sortAlphabetically } from '@/services/utils'
import { HelpIcon } from '@abc-transitionbascarbone/components'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { FormTextField } from '@abc-transitionbascarbone/components/src/form/TextField'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import GlossaryModal from '@abc-transitionbascarbone/components/src/modals/GlossaryModal'
import { SiteCAUnit, StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import { useToast } from '@abc-transitionbascarbone/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircularProgress, Typography } from '@mui/material'
import { getEvaluatedFormElement } from '@publicodes/forms'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import styles from './StudyRightsTiltSimplified.module.css'

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
  const [glossary, setGlossary] = useState('')
  const [siteData, setSiteData] = useState<TiltCustomDataFields | undefined>()
  const [loading, setLoading] = useState(true)
  const { showErrorToast } = useToast()
  const tGeneralError = useTranslations('error')

  const studySite = useMemo(() => study.sites.sort((a, b) => sortAlphabetically(a.id, b.id))[0], [study.sites])

  const form = useForm<ChangeStudySiteTiltSimplifiedCommand>({
    resolver: zodResolver(ChangeStudySiteTiltSimplifiedValidation),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      postalCode: siteData?.postalCode ?? '',
      structure: siteData?.structure ?? '',
      structureOther: ((siteData?.structureOther as string) ?? '').replace(/^'|'$/g, ''),
    },
  })

  const selectedStructure = useWatch({ control: form.control, name: 'structure' })
  const isOtherStructure = useMemo(() => {
    if (!selectedStructure) {
      return false
    }
    const engine = getTiltEngine().shallowCopy()
    engine.setSituation({ 'général . type': selectedStructure })
    return getEvaluatedFormElement(engine, 'général . type autre').applicable
  }, [selectedStructure])

  useEffect(() => {
    if (!isOtherStructure) {
      form.setValue('structureOther', '')
    }
  }, [isOtherStructure, form])

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

      const situationRes = await loadMappedSituation(study.id, studySite.id, {
        ...mappedTiltSituationToCustomDataFields,
        ...optionalTiltSituationToCustomDataFields,
      })

      if (situationRes.success && situationRes.data) {
        const newSiteData = situationRes.data
        setSiteData(newSiteData)

        form.reset({
          postalCode: String(newSiteData?.postalCode ?? ''),
          structure: String(newSiteData?.structure ?? ''),
          structureOther: String(newSiteData?.structureOther ?? '').replace(/^'|'$/g, ''),
        })
      }

      setLoading(false)
    }

    setStudySiteData()
  }, [form, study.id, studySite])

  const handleStudySiteUpdate = useCallback(
    async (studySiteId: string, data: ChangeStudySiteTiltSimplifiedCommand & TiltStudySiteFields) => {
      await callServerFunction(() => changeStudySiteTiltSimplified(studySiteId, data))
    },
    [callServerFunction],
  )

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
    form.handleSubmit(
      (data) => handleStudySiteUpdate(studySite.id, data),
      (e) => console.log('invalid', e),
    )()
  }, [form, handleStudySiteUpdate, studySite])

  const handleSiteChange = useCallback(
    async (siteId: string, data: ChangeStudySiteTiltSimplifiedCommand & TiltStudySiteFields) => {
      const studySite = study.sites.find((site) => site.site.id === siteId)
      if (studySite) {
        await handleStudySiteUpdate(studySite.id, data)
      } else {
        showErrorToast(tGeneralError('default'))
      }
    },
    [handleStudySiteUpdate, showErrorToast, study.sites, tGeneralError],
  )

  return (
    <>
      <Block
        title={tRights('general')}
        rightComponent={<SelectStudySite sites={study.sites} defaultValue="all" siteSelectionDisabled />}
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
                      onClick={() => setGlossary('postalCode')}
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
                  handleSpecificChange={handleSiteChange}
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
              {isOtherStructure && (
                <FormTextField
                  control={form.control}
                  name="structureOther"
                  label={t('structureOther')}
                  className={styles.formTextField}
                  onBlur={onStudySiteUpdate}
                />
              )}
              <Typography className="bold">{t('dates')}</Typography>
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
          </>
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
