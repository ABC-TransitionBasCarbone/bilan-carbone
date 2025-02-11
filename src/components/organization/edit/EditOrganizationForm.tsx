'use client'

import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import Modal from '@/components/base/Modal'
import { FormTextField } from '@/components/form/TextField'
import { OrganizationWithSites } from '@/db/user'
import { updateOrganizationCommand } from '@/services/serverFunctions/organization'
import {
  UpdateOrganizationCommand,
  UpdateOrganizationCommandValidation,
} from '@/services/serverFunctions/organization.command'
import { findStudiesWithSites } from '@/services/serverFunctions/study'
import { displayCA } from '@/utils/number'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Sites from '../Sites'

interface Props {
  organization: OrganizationWithSites
  caUnit: number
}

const emptySitesOnError = { authorizedStudySites: [], unauthorizedStudySites: [] }

const EditOrganizationForm = ({ organization, caUnit }: Props) => {
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
      sites: organization.sites.map((site) => ({ ...site, ca: site.ca ? displayCA(site.ca, caUnit) : 0 })),
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
      <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="edit-organization-button">
        {t('edit')}
      </LoadingButton>
      {error && <p>{error}</p>}
      <Modal
        open={!!sitesOnError.authorizedStudySites.length || !!sitesOnError.unauthorizedStudySites.length}
        label="delete-site-with-studies"
        title={t('title')}
        onClose={() => setSitesOnError(emptySitesOnError)}
        actions={[
          { actionType: 'button', onClick: () => setSitesOnError(emptySitesOnError), children: tStudySites('close') },
        ]}
      >
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
      </Modal>
    </Form>
  )
}

export default EditOrganizationForm
