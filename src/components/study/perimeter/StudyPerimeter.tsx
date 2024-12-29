'use client'

import { FormDatePicker } from '@/components/form/DatePicker'
import Sites from '@/components/organization/Sites'
import { FullStudy } from '@/db/study'
import { OrganizationWithSites } from '@/db/user'
import { addStudySite, changeStudyDates, hasEmissionSources, removeStudySite } from '@/services/serverFunctions/study'
import {
  ChangeStudyPerimeterCommand,
  ChangeStudyPerimeterCommandValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { useFormatter, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import DeleteStudySite from './DeleteStudySite'
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

  const [open, setOpen] = useState(false)
  const [siteToDelete, setDeletingSite] = useState('')
  const [studySites, setStudySites] = useState(study.sites.map((studySite) => studySite.site.id))

  const siteList = organization.sites
    .map((site) => {
      const existingStudySite = study.sites.find((s) => s.site.id === site.id)
      return { ...site, id: site.id, name: site.name, selected: !!existingStudySite }
    })
    .sort((a, b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0))

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
    if ((await form.trigger()) && form.formState.isValid) {
      await changeStudyDates({ startDate, endDate, studyId: study.id })
    }
  }

  useEffect(() => {
    onSubmit()
  }, [startDate, endDate])

  useEffect(() => {
    const selectedList = sites.filter((site) => site.selected).map((site) => site.id)
    studySites.forEach((siteId) => {
      if (!selectedList.includes(siteId)) {
        removeSite(siteId)
        setStudySites(selectedList)
      }
    })

    selectedList.forEach((siteId) => {
      if (!studySites.find((site) => site === siteId)) {
        const newSite = sites.find((site) => site.id === siteId)
        if (newSite) {
          addStudySite(study.id, study.organizationId, newSite)
          setStudySites([...studySites, siteId])
        }
      }
    })
  }, [sites])

  const removeSite = async (siteId: string) => {
    const hasSources = await hasEmissionSources(study.id, siteId, study.organizationId)
    if (hasSources) {
      setDeletingSite(siteId)
      setOpen(true)
      return
    }
    deleteSite(siteId)
  }

  const deleteSite = async (siteId: string) => removeStudySite(study.id, study.organizationId, siteId)

  const cancelDeletion = () => {
    setOpen(false)
    const reselectSite = form
      .getValues()
      .sites.map((site) => (site.id === siteToDelete ? { ...site, selected: true } : site))
    form.setValue('sites', reselectSite)
    setDeletingSite('')
  }

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
      <DeleteStudySite
        open={open}
        setOpen={setOpen}
        siteToDelete={siteToDelete}
        confirmDeletion={deleteSite}
        cancelDeletion={cancelDeletion}
      />
    </>
  )
}

export default StudyPerimeter
