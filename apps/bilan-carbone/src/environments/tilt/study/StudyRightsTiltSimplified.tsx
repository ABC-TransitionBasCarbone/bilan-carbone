'use client'

import Block from '@/components/base/Block'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormTextField } from '@/components/form/TextField'
import GlossaryModal from '@/components/modals/GlossaryModal'
import StudySites from '@/components/study/perimeter/StudySites'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import { OrganizationWithSites } from '@/db/account'
import type { FullStudy } from '@/db/study'
import { getTiltEngine } from '@/environments/tilt/publicodes/tilt-engine'
import { useServerFunction } from '@/hooks/useServerFunction'
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
import { HelpIcon } from '@abc-transitionbascarbone/components'
import { SiteCAUnit, StudyRole } from '@abc-transitionbascarbone/db-common/enums'
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
  const { siteId: studySite, studySiteId, setSite } = useStudySite(study)
  const [glossary, setGlossary] = useState('')
  const [siteData, setSiteData] = useState<TiltCustomDataFields | undefined>()
  const [loading, setLoading] = useState(true)

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
      if (studySite && studySite !== 'all') {
        const situationRes = await loadMappedSituation(study.id, studySiteId, {
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
      }
      setLoading(false)
    }

    setStudySiteData()
  }, [form, study.id, studySite, studySiteId])

  const handleStudySiteUpdate = useCallback(
    async (data: ChangeStudySiteTiltSimplifiedCommand) => {
      await callServerFunction(() => changeStudySiteTiltSimplified(studySiteId, data))
    },
    [callServerFunction, studySiteId],
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
