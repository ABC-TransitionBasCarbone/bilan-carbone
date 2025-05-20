'use client'
import Button from '@/components/base/Button'
import HelpIcon from '@/components/base/HelpIcon'
import IconLabel from '@/components/base/IconLabel'
import { FormDatePicker } from '@/components/form/DatePicker'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { OrganizationWithSites } from '@/db/account'
import { FullStudy } from '@/db/study'
import Sites from '@/environments/base/organization/Sites'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import SitesCut from '@/environments/cut/organization/Sites'

import {
  changeStudyDates,
  changeStudyExports,
  changeStudySites,
  hasActivityData,
} from '@/services/serverFunctions/study'
import {
  ChangeStudyDatesCommand,
  ChangeStudyDatesCommandValidation,
  ChangeStudySitesCommand,
  ChangeStudySitesCommandValidation,
  SitesCommand,
  StudyExportsCommand,
  StudyExportsCommandValidation,
} from '@/services/serverFunctions/study.command'
import { CA_UNIT_VALUES, displayCA } from '@/utils/number'
import { hasEditionRights } from '@/utils/study'
import { zodResolver } from '@hookform/resolvers/zod'
import { ControlMode, Environment, Export, SiteCAUnit, StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { useFormatter, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm, UseFormReturn, useWatch } from 'react-hook-form'
import DeleteStudySiteModal from './DeleteStudySiteModal'
import StudyExportsForm from './StudyExportsForm'
import styles from './StudyPerimeter.module.css'

interface Props {
  study: FullStudy
  organizationVersion: OrganizationWithSites
  userRoleOnStudy: StudyRole
  caUnit: SiteCAUnit
}

const dateFormat = { year: 'numeric', month: 'long', day: 'numeric' } as const

const StudyPerimeter = ({ study, organizationVersion, userRoleOnStudy, caUnit }: Props) => {
  const format = useFormatter()
  const tForm = useTranslations('study.new')
  const tGlossary = useTranslations('study.new.glossary')
  const t = useTranslations('study.perimeter')
  const [open, setOpen] = useState(false)
  const [glossary, setGlossary] = useState('')
  const [exportsValues, setExportsValues] = useState<Record<Export, ControlMode | false> | undefined>(undefined)
  const [isEditing, setIsEditing] = useState(false)
  const [deleting, setDeleting] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const hasEditionRole = useMemo(() => hasEditionRights(userRoleOnStudy), [userRoleOnStudy])
  const router = useRouter()

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
      exports: Object.values(Export).reduce(
        (acc, exportType) => ({
          ...acc,
          [exportType]: study.exports.find((studyExport) => studyExport.type === exportType)?.control || false,
        }),
        {},
      ),
    },
  })
  const exportsWatch = useWatch(exportsForm).exports
  const showControl = useMemo(() => Object.values(exportsWatch || {}).some((value) => value), [exportsWatch])

  const siteList = useMemo(
    () =>
      organizationVersion.organization.sites
        .map((site) => {
          const existingStudySite = study.sites.find((studySite) => studySite.site.id === site.id)
          return existingStudySite
            ? {
                ...existingStudySite,
                id: site.id,
                name: existingStudySite.site.name,
                selected: true,
                postalCode: existingStudySite.site.postalCode ?? '',
                city: existingStudySite.site.city ?? '',
              }
            : { ...site, selected: false, postalCode: site.postalCode ?? '', city: site.city ?? '' }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0)) || [],
    [organizationVersion.organization.sites, study.sites],
  )

  const siteForm = useForm<ChangeStudySitesCommand>({
    resolver: zodResolver(ChangeStudySitesCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      organizationId: organizationVersion.organization.id,
      sites: siteList,
    },
  })

  const sites = siteForm.watch('sites')
  const disabledUpdateButton = isEditing && sites.every((site) => !site.selected)

  useEffect(() => {
    siteForm.setValue(
      'sites',
      siteList.map((site) => ({ ...site, ca: displayCA(site.ca, CA_UNIT_VALUES[caUnit]) })),
    )
  }, [siteList, isEditing, caUnit])

  const onSitesSubmit = async () => {
    const deletedSites = sites.filter((site) => {
      return !site.selected && study.sites.some((studySite) => studySite.site.id === site.id)
    })
    const hasActivity = await hasActivityData(study.id, deletedSites, organizationVersion.id)
    if (hasActivity.success && hasActivity.data) {
      setOpen(true)
      setDeleting(deletedSites.length)
    } else {
      updateStudySites()
    }
  }

  const updateStudySites = async () => {
    setOpen(false)

    const result = await changeStudySites(study.id, siteForm.getValues())
    if (!result.success) {
      setError(result.errorMessage)
    } else {
      router.refresh()
      setIsEditing(false)
    }
  }

  const [startDate, endDate, realizationStartDate, realizationEndDate] = form.watch([
    'startDate',
    'endDate',
    'realizationStartDate',
    'realizationEndDate',
  ])
  const onDateSubmit = async (command: ChangeStudyDatesCommand) => {
    await form.trigger()
    if (form.formState.isValid) {
      await changeStudyDates(command)
    }
  }

  useEffect(() => {
    if (exportsValues && exportsForm.getValues().exports) {
      Object.entries(exportsForm.getValues().exports).forEach(([exportType, value]) => {
        if (exportsValues[exportType as Export] !== value) {
          changeStudyExports(study.id, exportType as Export, value)
        }
      })
    }
    setExportsValues(exportsForm.getValues().exports)
  }, [exportsWatch])

  useEffect(() => {
    onDateSubmit(form.getValues())
  }, [startDate, endDate, realizationStartDate, realizationEndDate])

  const Help = (name: string) => (
    <HelpIcon className="ml-4" onClick={() => setGlossary(name)} label={tGlossary('title')} />
  )

  return (
    <>
      {hasEditionRole ? (
        <>
          <div className="mb1">
            <IconLabel icon={Help('studyDates')} iconPosition="after" className="mb-2">
              <span className="inputLabel bold">{t('studyDates')}</span>
            </IconLabel>
            <div className={classNames(styles.dates, 'flex')}>
              <FormDatePicker control={form.control} translation={tForm} name="startDate" label={tForm('start')} />
              <FormDatePicker
                control={form.control}
                translation={tForm}
                name="endDate"
                label={tForm('end')}
                data-testid="study-endDate"
              />
            </div>
          </div>
          <div className="mb1">
            <IconLabel icon={Help('realizationDates')} iconPosition="after" className="mb-2">
              <span className="inputLabel bold">{t('realizationDates')}</span>
            </IconLabel>
            <div className={classNames(styles.dates, 'flex')}>
              <FormDatePicker
                control={form.control}
                translation={tForm}
                name="realizationStartDate"
                label={tForm('start')}
                clearable
              />
              <FormDatePicker
                control={form.control}
                translation={tForm}
                name="realizationEndDate"
                label={tForm('end')}
                data-testid="new-study-realizationEndDate"
                clearable
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
      <DynamicComponent
        environmentComponents={{
          [Environment.CUT]: (
            <SitesCut
              sites={
                isEditing
                  ? sites
                  : study.sites.map((site) => ({
                      ...site,
                      name: site.site.name,
                      selected: false,
                      postalCode: site.site.postalCode ?? '',
                      city: site.site.city ?? '',
                    }))
              }
              form={isEditing ? siteForm : undefined}
              caUnit={caUnit}
              withSelection
            />
          ),
        }}
        defaultComponent={
          <Sites
            sites={isEditing ? sites : study.sites.map((site) => ({ ...site, name: site.site.name, selected: false }))}
            form={isEditing ? (siteForm as unknown as UseFormReturn<SitesCommand>) : undefined}
            caUnit={caUnit}
            withSelection
          />
        }
      />
      {hasEditionRole && (
        <div className={classNames('mt1', { 'justify-between': isEditing })}>
          <Button
            data-testid={`${isEditing ? 'cancel-' : ''}edit-study-sites`}
            onClick={() => setIsEditing(!isEditing)}
          >
            {t(isEditing ? 'cancelEditSites' : 'editSites')}
          </Button>
          {isEditing && (
            <Button data-testid="confirm-edit-study-sites" disabled={disabledUpdateButton} onClick={onSitesSubmit}>
              {t('validSites')}
            </Button>
          )}
        </div>
      )}
      <StudyExportsForm
        form={exportsForm}
        showControl={showControl}
        setGlossary={setGlossary}
        t={t}
        disabled={!hasEditionRole}
      />
      <DeleteStudySiteModal
        open={open}
        confirmDeletion={updateStudySites}
        cancelDeletion={() => setOpen(false)}
        deleting={deleting}
      />
      {glossary && (
        <GlossaryModal glossary={glossary} onClose={() => setGlossary('')} label="emission-source" t={tGlossary}>
          <p className="mb-2">{tGlossary(`${glossary}Description`)}</p>
        </GlossaryModal>
      )}
      {error && <p>{error}</p>}
    </>
  )
}

export default StudyPerimeter
