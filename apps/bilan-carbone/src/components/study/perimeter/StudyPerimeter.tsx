'use client'

import Block from '@/components/base/Block'
import HelpIcon from '@/components/base/HelpIcon'
import IconLabel from '@/components/base/IconLabel'
import { FormDatePicker } from '@/components/form/DatePicker'
import GlossaryModal from '@/components/modals/GlossaryModal'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import { OrganizationWithSites } from '@/db/account'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { changeStudyDates, changeStudyExports } from '@/services/serverFunctions/study'
import {
  ChangeStudyDatesCommand,
  ChangeStudyDatesCommandValidation,
  StudyExportsCommand,
  StudyExportsCommandValidation,
} from '@/services/serverFunctions/study.command'
import { hasEditionRights } from '@/utils/study'
import { zodResolver } from '@hookform/resolvers/zod'
import { ControlMode, Export, SiteCAUnit, StudyRole } from '@prisma/client'
import { Button } from '@repo/ui'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useFormatter, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import StudyExportsForm from './StudyExportsForm'
import styles from './StudyPerimeter.module.css'
import StudySites from './StudySites'

interface Props {
  study: FullStudy
  organizationVersion: OrganizationWithSites
  userRoleOnStudy: StudyRole
  caUnit: SiteCAUnit
  user: UserSession
}

const dateFormat = { year: 'numeric', month: 'long', day: 'numeric' } as const

const StudyPerimeter = ({ study, organizationVersion, userRoleOnStudy, caUnit, user }: Props) => {
  const format = useFormatter()
  const tLabel = useTranslations('common.label')
  const tGlossary = useTranslations('study.new.glossary')
  const tValidation = useTranslations('validation')
  const t = useTranslations('study.perimeter')
  const [glossary, setGlossary] = useState('')
  const hasEditionRole = useMemo(() => hasEditionRights(userRoleOnStudy), [userRoleOnStudy])
  const router = useRouter()
  const { callServerFunction } = useServerFunction()

  const form = useForm<ChangeStudyDatesCommand>({
    resolver: zodResolver(ChangeStudyDatesCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      startDate: study.startDate.toISOString(),
      endDate: study.endDate.toISOString(),
      realizationStartDate: study.realizationStartDate?.toISOString(),
      realizationEndDate: study.realizationEndDate?.toISOString(),
    },
  })

  const exportsForm = useForm<StudyExportsCommand>({
    resolver: zodResolver(StudyExportsCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      exports: study.exports?.types || [],
      controlMode: study.exports?.control,
    },
  })
  const exportsWatch = useWatch(exportsForm).exports
  const controlWatch = useWatch(exportsForm).controlMode
  const showControl = useMemo(() => !!(exportsWatch && exportsWatch.length), [exportsWatch])

  const [startDate, endDate, realizationStartDate, realizationEndDate] = form.watch([
    'startDate',
    'endDate',
    'realizationStartDate',
    'realizationEndDate',
  ])

  const handleDateChange = useCallback(async () => {
    const isValid = await form.trigger()
    if (isValid) {
      const values = form.getValues()
      await callServerFunction(() => changeStudyDates(values), {
        onSuccess: () => {
          router.refresh()
        },
        onError: () => {
          router.refresh()

          form.reset({
            studyId: study.id,
            startDate: study.startDate.toISOString(),
            endDate: study.endDate.toISOString(),
            realizationStartDate: study.realizationStartDate?.toISOString() ?? null,
            realizationEndDate: study.realizationEndDate?.toISOString() ?? null,
          })
        },
        getErrorMessage: (errorMessage: string) => {
          const [key, studyName] = errorMessage.split(':')
          return tValidation(key, studyName ? { studyName } : undefined)
        },
      })
    }
  }, [form, callServerFunction, router, tValidation, study])

  const updateStudyExport = useCallback(
    async (exportTypes: Export[], control: ControlMode) => {
      await callServerFunction(() => changeStudyExports(study.id, exportTypes, control))
    },
    [callServerFunction, study.id],
  )

  useEffect(() => {
    if (exportsWatch && hasEditionRole) {
      updateStudyExport(exportsForm.getValues().exports, controlWatch || ControlMode.Operational)
    }
  }, [exportsForm, exportsWatch, controlWatch, updateStudyExport])

  const Help = (name: string) => (
    <HelpIcon className="ml-4" onClick={() => setGlossary(name)} label={tGlossary('title')} />
  )

  return (
    <Block
      title={t('title', { name: study.name })}
      as="h2"
      rightComponent={<SelectStudySite sites={study.sites} siteSelectionDisabled />}
    >
      <h3 className="mb1">{t('general', { name: study.name })}</h3>
      {hasEditionRole ? (
        <>
          <div className="mb2">
            <IconLabel icon={Help('studyDates')} iconPosition="after" className="mb-2">
              <span className="inputLabel bold">{t('studyDates')}</span>
            </IconLabel>
            <div className={classNames(styles.dates, 'flex')}>
              <FormDatePicker
                control={form.control}
                name="startDate"
                label={tLabel('start')}
                onAccept={handleDateChange}
              />
              <FormDatePicker
                control={form.control}
                name="endDate"
                label={tLabel('end')}
                data-testid="study-endDate"
                onAccept={handleDateChange}
              />
            </div>
          </div>
          <div className="mb2">
            <IconLabel icon={Help('realizationDates')} iconPosition="after" className="mb-2">
              <span className="inputLabel bold">{t('realizationDates')}</span>
            </IconLabel>
            <div className={classNames(styles.dates, 'flex')}>
              <FormDatePicker
                control={form.control}
                name="realizationStartDate"
                label={tLabel('start')}
                clearable
                onAccept={handleDateChange}
              />
              <FormDatePicker
                control={form.control}
                name="realizationEndDate"
                label={tLabel('end')}
                data-testid="new-study-realizationEndDate"
                clearable
                onAccept={handleDateChange}
              />
            </div>
          </div>
        </>
      ) : (
        <p className="mb1 flex-col">
          <span>
            {t('dates', {
              startDate: format.dateTime(new Date(startDate), dateFormat),
              endDate: format.dateTime(new Date(endDate), dateFormat),
            })}
          </span>
          <span>
            {realizationStartDate && !realizationEndDate && (
              <>{t('realizationFrom', { date: format.dateTime(new Date(realizationStartDate), dateFormat) })}</>
            )}
            {!realizationStartDate && realizationEndDate && (
              <>{t('realizationUntil', { date: format.dateTime(new Date(realizationEndDate), dateFormat) })}</>
            )}
            {realizationStartDate && realizationEndDate && (
              <>
                {t('realizedDates', {
                  startDate: format.dateTime(new Date(realizationStartDate), dateFormat),
                  endDate: format.dateTime(new Date(realizationEndDate), dateFormat),
                })}
              </>
            )}
          </span>
        </p>
      )}
      <StudySites
        study={study}
        organizationVersion={organizationVersion}
        userRoleOnStudy={userRoleOnStudy}
        caUnit={caUnit}
        user={user}
      />

      <StudyExportsForm
        form={exportsForm}
        study={study}
        showControl={showControl}
        setGlossary={setGlossary}
        t={t}
        disabled={!hasEditionRole}
      />

      {glossary && (
        <GlossaryModal glossary={glossary} onClose={() => setGlossary('')} label="emission-source" t={tGlossary}>
          <p className="mb-2">{tGlossary(`${glossary}Description`)}</p>
        </GlossaryModal>
      )}
    </Block>
  )
}

export default StudyPerimeter
