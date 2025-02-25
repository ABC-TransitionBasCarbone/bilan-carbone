'use client'
import Button from '@/components/base/Button'
import { FormDatePicker } from '@/components/form/DatePicker'
import Sites from '@/components/organization/Sites'
import { FullStudy } from '@/db/study'
import { OrganizationWithSites } from '@/db/user'
import { changeStudyDates, changeStudySites, hasActivityData } from '@/services/serverFunctions/study'
import {
  ChangeStudyDatesCommand,
  ChangeStudyDatesCommandValidation,
  ChangeStudySitesCommand,
  ChangeStudySitesCommandValidation,
} from '@/services/serverFunctions/study.command'
import { getUserSettings } from '@/services/serverFunctions/user'
import { CA_UNIT_VALUES, defaultCAUnit, displayCA } from '@/utils/number'
import { zodResolver } from '@hookform/resolvers/zod'
import { StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { useFormatter, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import DeleteStudySite from './DeleteStudySites'
import styles from './StudyPerimeter.module.css'

interface Props {
  study: FullStudy
  organization: OrganizationWithSites
  userRoleOnStudy: StudyRole
}

const StudyPerimeter = ({ study, organization, userRoleOnStudy }: Props) => {
  const format = useFormatter()
  const tForm = useTranslations('study.new')
  const t = useTranslations('study.perimeter')
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleting, setDeleting] = useState(0)
  const [caUnit, setCAUnit] = useState(defaultCAUnit)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    applyUserSettings()
  }, [])

  const applyUserSettings = async () => {
    const caUnit = (await getUserSettings())?.caUnit
    if (caUnit !== undefined) {
      setCAUnit(CA_UNIT_VALUES[caUnit])
    }
  }

  const form = useForm<ChangeStudyDatesCommand>({
    resolver: zodResolver(ChangeStudyDatesCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      startDate: study.startDate.toISOString(),
      endDate: study.endDate.toISOString(),
    },
  })

  const siteList = useMemo(
    () =>
      organization.sites
        .map((site) => {
          const existingStudySite = study.sites.find((studySite) => studySite.site.id === site.id)
          return existingStudySite
            ? { ...existingStudySite, id: site.id, name: existingStudySite.site.name, selected: true }
            : { ...site, selected: false }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0)) || [],
    [organization.sites, study.sites],
  )

  const siteForm = useForm<ChangeStudySitesCommand>({
    resolver: zodResolver(ChangeStudySitesCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      organizationId: organization.id,
      sites: siteList,
    },
  })

  const sites = siteForm.watch('sites')
  const disabledUpdateButton = isEditing && sites.every((site) => !site.selected)

  useEffect(() => {
    siteForm.setValue(
      'sites',
      siteList.map((site) => ({ ...site, ca: displayCA(site.ca, caUnit) })),
    )
  }, [siteList, isEditing, caUnit])

  const onSitesSubmit = async () => {
    const deletedSites = sites.filter((site) => {
      return !site.selected && study.sites.some((studySite) => studySite.site.id === site.id)
    })
    const hasActivity = await hasActivityData(study.id, deletedSites, organization.id)
    if (hasActivity) {
      setOpen(true)
      setDeleting(deletedSites.length)
    } else {
      updateStudySites()
    }
  }

  const updateStudySites = async () => {
    setOpen(false)

    const result = await changeStudySites(study.id, siteForm.getValues())
    if (result) {
      setError(result)
    } else {
      router.refresh()
      setIsEditing(false)
    }
  }

  const [startDate, endDate] = form.watch(['startDate', 'endDate'])
  const onDateSubmit = async (command: ChangeStudyDatesCommand) => {
    await form.trigger()
    if (form.formState.isValid) {
      await changeStudyDates(command)
    }
  }

  useEffect(() => {
    onDateSubmit(form.getValues())
  }, [startDate, endDate])

  return (
    <>
      {userRoleOnStudy !== StudyRole.Reader ? (
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
      ) : (
        <p>
          {t('dates', {
            startDate: format.dateTime(new Date(startDate), { year: 'numeric', month: 'long', day: 'numeric' }),
            endDate: format.dateTime(new Date(endDate), { year: 'numeric', month: 'long', day: 'numeric' }),
          })}
        </p>
      )}
      <Sites
        form={isEditing ? siteForm : undefined}
        sites={isEditing ? sites : study.sites.map((site) => ({ ...site, name: site.site.name, selected: false }))}
        withSelection
      />
      {userRoleOnStudy !== StudyRole.Reader && (
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
      <DeleteStudySite
        open={open}
        confirmDeletion={updateStudySites}
        cancelDeletion={() => setOpen(false)}
        deleting={deleting}
      />
      {error && <p>{error}</p>}
    </>
  )
}

export default StudyPerimeter
