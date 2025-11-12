'use client'

import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import { FormTextField } from '@/components/form/TextField'
import Modal from '@/components/modals/Modal'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import DynamicSites from '@/environments/core/organization/DynamicSites'
import { useServerFunction } from '@/hooks/useServerFunction'
import { updateOrganizationCommand } from '@/services/serverFunctions/organization'
import {
  UpdateOrganizationCommand,
  UpdateOrganizationCommandValidation,
} from '@/services/serverFunctions/organization.command'
import { findStudiesWithSites } from '@/services/serverFunctions/study'
import { handleWarningText } from '@/utils/components'
import { CA_UNIT_VALUES, displayCA } from '@/utils/number'
import { IsSuccess } from '@/utils/serverResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import { SiteCAUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface Props {
  organizationVersion: OrganizationVersionWithOrganization
  caUnit: SiteCAUnit
  isCut?: boolean
}

type StudiesWithSites = IsSuccess<AsyncReturnType<typeof findStudiesWithSites>>

const emptySitesOnError = { authorizedStudySites: [], unauthorizedStudySites: [] }

const EditOrganizationForm = ({ organizationVersion, caUnit, isCut = false }: Props) => {
  const router = useRouter()
  const t = useTranslations('organization.form')
  const tStudySites = useTranslations('organization.studySites')

  const [sitesOnError, setSitesOnError] = useState<StudiesWithSites>(emptySitesOnError)
  const { callServerFunction } = useServerFunction()

  const form = useForm<UpdateOrganizationCommand>({
    resolver: zodResolver(UpdateOrganizationCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      organizationVersionId: organizationVersion.id,
      name: organizationVersion.organization.name,
      sites: organizationVersion.organization.sites.map((site) => ({
        ...site,
        ca: site.ca ? displayCA(site.ca, CA_UNIT_VALUES[caUnit]) : 0,
        postalCode: site.postalCode ?? '',
        city: site.city ?? '',
        cncId: site.cncId ?? '',
        cncCode: site.cnc?.cncCode || '',
        volunteerNumber: site.volunteerNumber || 0,
        beneficiaryNumber: site.beneficiaryNumber || 0,
      })),
    },
  })

  const onSubmit = async (command: UpdateOrganizationCommand) => {
    setSitesOnError(emptySitesOnError)
    const deletedSiteIds = organizationVersion.organization.sites
      .filter((site) => !command.sites.find((s) => s.id === site.id))
      .map((site) => site.id)
    const deletedSitesOnStudies = await findStudiesWithSites(deletedSiteIds)
    if (
      deletedSitesOnStudies.success &&
      (deletedSitesOnStudies.data.authorizedStudySites.length > 0 ||
        deletedSitesOnStudies.data.unauthorizedStudySites.length > 0)
    ) {
      setSitesOnError(deletedSitesOnStudies.data)
    } else {
      await callServerFunction(() => updateOrganizationCommand(command), {
        onSuccess: () => {
          router.push(`/organisations/${organizationVersion.id}`)
        },
      })
    }
  }

  const sites = form.watch('sites')
  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      {!isCut && (
        <FormTextField data-testid="edit-organization-name" control={form.control} name="name" label={t('name')} />
      )}
      <DynamicSites sites={sites} form={form} caUnit={caUnit} />
      <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="edit-organization-button">
        {t('edit')}
      </LoadingButton>
      <Modal
        open={!!sitesOnError.authorizedStudySites.length || !!sitesOnError.unauthorizedStudySites.length}
        label="delete-site-with-studies"
        title={t('title')}
        onClose={() => setSitesOnError(emptySitesOnError)}
        actions={[
          { actionType: 'button', onClick: () => setSitesOnError(emptySitesOnError), children: tStudySites('close') },
        ]}
      >
        <div id="delete-site-with-studies-modal-description" className="flex-col">
          {handleWarningText(tStudySites, 'description')}
          <ul>
            {sitesOnError &&
              sitesOnError.authorizedStudySites.map((studySite) => (
                <li key={studySite.id}>
                  {tStudySites.rich('existingSite', {
                    name: () =>
                      `${studySite.site.name}${studySite.study.organizationVersion.isCR ? ` (${studySite.site.organization.name})` : ''}`,
                    link: () => <Link href={`/etudes/${studySite.studyId}/perimetre`}>{studySite.study.name}</Link>,
                  })}
                </li>
              ))}
            {sitesOnError &&
              sitesOnError.unauthorizedStudySites.map((studySite) => (
                <li key={studySite.site.name}>
                  {tStudySites('existingUnauthorizedSite', {
                    name: `${studySite.site.name}${studySite.study.organizationVersion.isCR ? ` (${studySite.site.organization.name})` : ''}`,
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
