'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { FormTextField } from '@/components/form/TextField'
import Button from '@/components/base/Button'
import { useRouter } from 'next/navigation'
import Form from '@/components/base/Form'
import Block from '@/components/base/Block'
import {
  CreateOrganizationCommand,
  CreateOrganizationCommandValidation,
} from '@/services/serverFunctions/organization.command'
import { createOrganizationCommand } from '@/services/serverFunctions/organization'

const NewOrganizationForm = () => {
  const router = useRouter()
  const t = useTranslations('organization.new')
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
      setError(result.message)
    } else {
      router.push(`/organisations/${result.id}`)
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
        <Button type="submit" disabled={form.formState.isSubmitting} data-testid="new-organization-create-button">
          {t('create')}
        </Button>
        {error && <p>{error}</p>}
      </Form>
    </Block>
  )
}

export default NewOrganizationForm
