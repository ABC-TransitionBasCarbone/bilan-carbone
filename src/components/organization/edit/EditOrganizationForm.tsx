'use client'

import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import { FormTextField } from '@/components/form/TextField'
import { OrganizationWithSites } from '@/db/user'
import { updateOrganizationCommand } from '@/services/serverFunctions/organization'
import {
  UpdateOrganizationCommand,
  UpdateOrganizationCommandValidation,
} from '@/services/serverFunctions/organization.command'
import { findStudiesWithSites } from '@/services/serverFunctions/study'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Sites from '../Sites'

interface Props {
  organization: OrganizationWithSites
}

interface SiteOnError {
  id: string
  studyId: string
  siteName: string
  studyName: string
  organizationName: string
  fromCROrga: boolean
}

const EditOrganizationForm = ({ organization }: Props) => {
  const router = useRouter()
  const t = useTranslations('organization.form')
  const tStudySites = useTranslations('organization.studySites')
  const [error, setError] = useState('')
  const [sitesOnError, setSitesOnError] = useState<SiteOnError[]>([])

  const form = useForm<UpdateOrganizationCommand>({
    resolver: zodResolver(UpdateOrganizationCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      organizationId: organization.id,
      name: organization.name,
      sites: organization.sites,
    },
  })

  const onSubmit = async (command: UpdateOrganizationCommand) => {
    setSitesOnError([])
    const deletedSiteIds = organization.sites
      .filter((site) => !command.sites.find((s) => s.id === site.id))
      .map((site) => site.id)
    const deletedSitesOnStudies = await findStudiesWithSites(deletedSiteIds)
    if (deletedSitesOnStudies.length > 0) {
      setSitesOnError(
        deletedSitesOnStudies.map((studySite) => ({
          id: studySite.id,
          studyId: studySite.studyId,
          siteName: studySite.site.name,
          studyName: studySite.study.name,
          organizationName: studySite.site.organization.name,
          fromCROrga: studySite.site.organization.isCR,
        })),
      )
    } else {
      const result = await updateOrganizationCommand(command)
      if (result) {
        setError(result)
      } else {
        router.push(`/organisations/${organization.id}`)
        router.refresh()
      }
    }
  }

  const sites = form.watch('sites')
  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <FormTextField
        data-testid="edit-organization-name"
        control={form.control}
        translation={t}
        name="name"
        label={t('name')}
      />
      <Sites sites={sites} form={form} />
      <Button type="submit" disabled={form.formState.isSubmitting} data-testid="edit-organization-button">
        {t('edit')}
      </Button>
      {error && <p>{error}</p>}
      <Dialog
        open={sitesOnError.length > 0}
        aria-labelledby="delete-site-with-studies-dialog-title"
        aria-describedby="delete-site-with-studies-dialog-description"
      >
        <DialogTitle id="delete-site-with-studies-dialog-title">{tStudySites('title')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-site-with-studies-dialog-description" className="flex-col">
            {tStudySites('description')}
            {sitesOnError.map((studySite) => (
              <span key={studySite.id}>
                {tStudySites.rich('existingSite', {
                  n: () => `${studySite.siteName}${studySite.fromCROrga ? ` (${studySite.organizationName})` : ''}`,
                  l: () => <Link href={`/etudes/${studySite.studyId}/perimetre`}>{studySite.studyName}</Link>,
                })}
              </span>
            ))}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSitesOnError([])}>{tStudySites('close')}</Button>
        </DialogActions>
      </Dialog>
    </Form>
  )
}

export default EditOrganizationForm
