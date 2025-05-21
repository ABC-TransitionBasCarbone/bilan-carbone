'use client'

import Block from '@/components/base/Block'
import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import { FormTextField } from '@/components/form/TextField'
import { createOrganizationCommand } from '@/services/serverFunctions/organization'
import {
  CreateOrganizationCommand,
  CreateOrganizationCommandValidation,
} from '@/services/serverFunctions/organization.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

const NewOrganizationForm = () => {
  const router = useRouter()
  const t = useTranslations('organization.form')
  const [error, setError] = useState('')

  const form = useForm<CreateOrganizationCommand>({
    resolver: zodResolver(CreateOrganizationCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
    },
  })

  const onSubmit = async (command: CreateOrganizationCommand) => {
    const result = await createOrganizationCommand(command)
    if (!result.success) {
      setError(result.errorMessage)
    } else {
      router.push(`/organisations/${result.data.id}`)
      router.refresh()
    }
  }

  return (
    <Block title={t('title')} as="h1" data-testid="new-organization-title">
      <Form onSubmit={form.handleSubmit(onSubmit)}>
        <FormTextField
          data-testid="new-organization-name"
          control={form.control}
          translation={t}
          name="name"
          label={t('name')}
        />
        <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="new-organization-create-button">
          {t('create')}
        </LoadingButton>
        {error && <p>{error}</p>}
      </Form>
    </Block>
  )
}

export default NewOrganizationForm
