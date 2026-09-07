'use client'

import { FormAutocomplete } from '@/components/form/Autocomplete'
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
  ChangeStudySiteTiltSimplifiedCommand,
  ChangeStudySiteTiltSimplifiedValidation,
  ChangeTiltStudyDatesCommand,
  ChangeTiltStudyDatesCommandValidation,
} from '@/services/serverFunctions/study.command'
import { sortAlphabetically } from '@/services/utils'
import { HelpIcon } from '@abc-transitionbascarbone/components'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { FormTextField } from '@abc-transitionbascarbone/components/src/form/TextField'
import YearPicker from '@abc-transitionbascarbone/components/src/form/YearPicker'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import GlossaryModal from '@abc-transitionbascarbone/components/src/modals/GlossaryModal'
import { SiteCAUnit, StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircularProgress, Typography } from '@mui/material'
import { getEvaluatedFormElement } from '@publicodes/forms'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
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

  const dateForm = useForm<ChangeTiltStudyDatesCommand>({
    resolver: zodResolver(ChangeTiltStudyDatesCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      studyDate: study.startDate.getFullYear().toString(),
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

  const handleDateChange = useCallback(
    async (studyDate: string) => {
      dateForm.setValue('studyDate', studyDate, { shouldValidate: true })
      const isValid = await dateForm.trigger('studyDate')
      if (isValid) {
        const values = dateForm.getValues()
        const payload = {
          studyId: values.studyId,
          startDate: new Date(`${values.studyDate}-01-01`).toISOString(),
          endDate: new Date(`${values.studyDate}-12-31`).toISOString(),
        }
        await callServerFunction(() => changeStudyDates(payload), {
          onError: () => {
            router.refresh()

            dateForm.reset({
              studyId: study.id,
              studyDate: study.startDate.getFullYear().toString(),
            })
          },
          getErrorMessage: (errorMessage: string) => tValidation(errorMessage),
        })
      }
    },
    [dateForm, callServerFunction, router, tValidation, study],
  )

  const onStudySiteUpdate = useCallback(() => {
    form.handleSubmit(
      (data) =>
        callServerFunction(() => {
          setSiteData(data)
          return changeStudySiteTiltSimplified(study.id, data)
        }),
      (e) => console.log('invalid', e),
    )()
  }, [callServerFunction, form, study.id])

  const handleSiteChange = useCallback(async () => {
    await callServerFunction(() => changeStudySiteTiltSimplified(study.id, siteData))
  }, [callServerFunction, siteData, study.id])

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
                <Controller
                  control={dateForm.control}
                  name="studyDate"
                  render={({ field: { onChange, value } }) => (
                    <YearPicker
                      label={tLabel('targetYear')}
                      value={value}
                      onChange={(newStudyDate) => {
                        onChange(newStudyDate)
                        void handleDateChange(newStudyDate)
                      }}
                    />
                  )}
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
