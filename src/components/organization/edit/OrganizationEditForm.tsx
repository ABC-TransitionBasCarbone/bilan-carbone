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

interface Props {
  organization: OrganizationWithSites
}

const OrganizationEditForm = ({ organization }: Props) => {
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
    },
  })

  const onSubmit = async (command: UpdateOrganizationCommand) => {
    console.log(command)
    const result = await updateOrganizationCommand(command)
    console.log(result)
    if (result) {
      setError(result)
    } else {
      router.push(`/organisations/${organization.id}`)
      router.refresh()
    }
  }

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <FormTextField
        data-testid="edit-organization-name"
        control={form.control}
        translation={t}
        name="name"
        label={t('name')}
      />
      <Button type="submit" disabled={form.formState.isSubmitting} data-testid="edit-organization-button">
        {t('edit')}
      </Button>
      {error && <p>{error}</p>}
    </Form>
  )
}

export default OrganizationEditForm
