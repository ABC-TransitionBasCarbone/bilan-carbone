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
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'
import Sites from '../Sites'

interface Props {
  organization: OrganizationWithSites
}

const EditOrganizationForm = ({ organization }: Props) => {
  const router = useRouter()
  const t = useTranslations('organization.form')
  const [error, setError] = useState('')

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
    const result = await updateOrganizationCommand(command)
    if (result) {
      setError(result)
    } else {
      router.push(`/organisations/${organization.id}`)
      router.refresh()
    }
  }

  const addSite = () => form.setValue('sites', [...form.getValues().sites, { id: uuidv4(), name: '', etp: 0, ca: 0 }])

  const removeSite = (id: string) => {
    form.setValue(
      'sites',
      form.getValues().sites.filter((site) => site.id !== id),
    )
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
      <Sites sites={sites} form={form} addSite={addSite} removeSite={removeSite} />
      <Button type="submit" disabled={form.formState.isSubmitting} data-testid="edit-organization-button">
        {t('edit')}
      </Button>
      {error && <p>{error}</p>}
    </Form>
  )
}

export default EditOrganizationForm
