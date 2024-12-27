'use client'
import { FormDatePicker } from '@/components/form/DatePicker'
import Sites from '@/components/organization/Sites'
import { FullStudy } from '@/db/study'
import { OrganizationWithSites } from '@/db/user'
import { addStudySite, changeStudyDates, removeStudySite } from '@/services/serverFunctions/study'
import {
  ChangeStudyPerimeterCommand,
  ChangeStudyPerimeterCommandValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { useFormatter, useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import styles from './StudyPerimeter.module.css'

interface Props {
  study: FullStudy
  userRoleOnStudy?: FullStudy['allowedUsers'][0]
  organization: OrganizationWithSites
}

const StudyPerimeter = ({ study, userRoleOnStudy, organization }: Props) => {
  const format = useFormatter()
  const tForm = useTranslations('study.new')
  const t = useTranslations('study.perimeter')
  const [selectedSites, setSelectedSites] = useState(study.sites.map((studySite) => studySite.site.id))

  const siteList = useMemo(
    () =>
      organization.sites
        .map((site) => {
          const existingStudySite = study.sites.find((studySite) => studySite.site.id === site.id)
          return existingStudySite
            ? { ...existingStudySite, id: site.id, name: existingStudySite.site.name, selected: true }
            : { ...site, selected: false }
        })
        .sort((a, b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0)) || [],
    [organization.sites, study.sites],
  )

  const form = useForm<ChangeStudyPerimeterCommand>({
    resolver: zodResolver(ChangeStudyPerimeterCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      organizationId: study.organizationId,
      startDate: study.startDate.toISOString(),
      endDate: study.endDate.toISOString(),
      sites: siteList,
    },
  })

  const [startDate, endDate] = form.watch(['startDate', 'endDate'])
  const sites = useWatch({ control: form.control, name: 'sites' })
  const onSubmit = async () => {
    await form.trigger()
    if (form.formState.isValid) {
      await changeStudyDates({ startDate, endDate, studyId: study.id })
    }
  }

  useEffect(() => {
    onSubmit()
  }, [startDate, endDate])

  useEffect(() => {
    const selectedList = sites.filter((site) => site.selected).map((site) => site.id)
    selectedSites.forEach((siteId) => {
      if (!selectedList.includes(siteId)) {
        removeStudySite(study.id, study.organizationId, siteId)
      }
    })
    selectedList.forEach((siteId) => {
      if (!selectedSites.includes(siteId)) {
        const newSite = sites.find((site) => site.id === siteId)
        if (newSite) {
          addStudySite(study.id, study.organizationId, newSite)
        }
      }
    })
    setSelectedSites(selectedList)
  }, [sites])

  return (
    <>
      {userRoleOnStudy && userRoleOnStudy.role !== StudyRole.Reader ? (
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
      <Sites form={form} studyId={study.id} sites={siteList} />
    </>
  )
}

export default StudyPerimeter
