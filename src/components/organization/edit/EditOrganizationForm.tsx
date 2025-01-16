'use client'

import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import Spinner from '@/components/base/Spinner'
import { FormTextField } from '@/components/form/TextField'
import { OrganizationWithSites } from '@/db/user'
import { updateOrganizationCommand } from '@/services/serverFunctions/organization'
import {
  UpdateOrganizationCommand,
  UpdateOrganizationCommandValidation,
} from '@/services/serverFunctions/organization.command'
import { findStudiesWithSites } from '@/services/serverFunctions/study'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Sites from '../Sites'

interface Props {
  organization: OrganizationWithSites
}

const emptySitesOnError = { authorizedStudySites: [], unauthorizedStudySites: [] }

const EditOrganizationForm = ({ organization }: Props) => {
  const router = useRouter()
  const t = useTranslations('organization.form')
  const tStudySites = useTranslations('organization.studySites')
  const [error, setError] = useState('')
  const [sitesOnError, setSitesOnError] = useState<AsyncReturnType<typeof findStudiesWithSites>>(emptySitesOnError)

  const form = useForm<UpdateOrganizationCommand>({
    resolver: zodResolver(UpdateOrganizationCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      organizationId: organization.id,
      name: organization.name,
      sites: organization.sites.map((site) => ({ ...site, ca: site.ca ? site.ca / 1000 : 0 })),
    },
  })

  const onSubmit = async (command: UpdateOrganizationCommand) => {
    setSitesOnError(emptySitesOnError)
    const deletedSiteIds = organization.sites
      .filter((site) => !command.sites.find((s) => s.id === site.id))
      .map((site) => site.id)
    const deletedSitesOnStudies = await findStudiesWithSites(deletedSiteIds)
    if (
      deletedSitesOnStudies.authorizedStudySites.length > 0 ||
      deletedSitesOnStudies.unauthorizedStudySites.length > 0
    ) {
      setSitesOnError(deletedSitesOnStudies)
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
      <Sites form={form} sites={sites} />
      <Button type="submit" disabled={form.formState.isSubmitting} data-testid="edit-organization-button">
        {form.formState.isSubmitting ? <Spinner size={1} /> : <>{t('edit')}</>}
      </Button>
      {error && <p>{error}</p>}
      <Dialog
        open={!!sitesOnError.authorizedStudySites.length || !!sitesOnError.unauthorizedStudySites.length}
        aria-labelledby="delete-site-with-studies-dialog-title"
        aria-describedby="delete-site-with-studies-dialog-description"
      >
        <DialogTitle id="delete-site-with-studies-dialog-title">{tStudySites('title')}</DialogTitle>
        <DialogContent>
          <div id="delete-site-with-studies-dialog-description" className="flex-col">
            {tStudySites('description')}
            <ul>
              {sitesOnError &&
                sitesOnError.authorizedStudySites.map((studySite) => (
                  <li key={studySite.id}>
                    {tStudySites.rich('existingSite', {
                      name: () =>
                        `${studySite.site.name}${studySite.site.organization.isCR ? ` (${studySite.site.organization.name})` : ''}`,
                      link: () => <Link href={`/etudes/${studySite.studyId}/perimetre`}>{studySite.study.name}</Link>,
                    })}
                  </li>
                ))}
              {sitesOnError &&
                sitesOnError.unauthorizedStudySites.map((studySite) => (
                  <li key={studySite.site.name}>
                    {tStudySites('existingUnauthorizedSite', {
                      name: `${studySite.site.name}${studySite.site.organization.isCR ? ` (${studySite.site.organization.name})` : ''}`,
                      count: studySite.count,
                    })}
                  </li>
                ))}
            </ul>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSitesOnError(emptySitesOnError)}>{tStudySites('close')}</Button>
        </DialogActions>
      </Dialog>
    </Form>
  )
}

export default EditOrganizationForm
