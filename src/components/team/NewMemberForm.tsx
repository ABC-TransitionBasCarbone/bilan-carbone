'use client'

import Form from '@/components/base/Form'
import { FormTextField } from '@/components/form/TextField'
import { addMember } from '@/services/serverFunctions/user'
import { AddMemberCommand, AddMemberCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem } from '@mui/material'
import { Level, Role } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import LoadingButton from '../base/LoadingButton'
import { FormSelect } from '../form/Select'

const NewMemberForm = () => {
  const router = useRouter()
  const t = useTranslations('newMember')
  const tLevel = useTranslations('level')
  const tRole = useTranslations('role')

  const [error, setError] = useState('')

  const form = useForm<AddMemberCommand>({
    resolver: zodResolver(AddMemberCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  })

  const onSubmit = async (command: AddMemberCommand) => {
    const result = await addMember(command)
    if (result) {
      setError(result)
    } else {
      router.push('/equipe')
      router.refresh()
    }
  }

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <FormTextField
        data-testid="new-member-firstName"
        type="firstName"
        control={form.control}
        translation={t}
        name="firstName"
        label={t('firstName')}
      />
      <FormTextField
        data-testid="new-member-lastName"
        type="lastName"
        control={form.control}
        translation={t}
        name="lastName"
        label={t('lastName')}
      />
      <FormTextField
        data-testid="new-member-email"
        type="email"
        control={form.control}
        translation={t}
        name="email"
        label={t('email')}
      />
      <FormSelect control={form.control} translation={t} name="level" label={t('level')} data-testid="new-member-level">
        {Object.keys(Level).map((key) => (
          <MenuItem key={key} value={key}>
            {tLevel(key)}
          </MenuItem>
        ))}
      </FormSelect>
      <FormSelect control={form.control} translation={t} name="role" label={t('role')} data-testid="new-member-role">
        {Object.keys(Role)
          .filter((role) => role !== Role.SUPER_ADMIN && role !== Role.ADMIN)
          .map((key) => (
            <MenuItem key={key} value={key}>
              {tRole(key)}
            </MenuItem>
          ))}
      </FormSelect>
      <LoadingButton
        type="submit"
        disabled={form.formState.isSubmitting}
        loading={form.formState.isSubmitting}
        data-testid="new-member-create-button"
      >
        {t('create')}
      </LoadingButton>
      {error && <p>{error}</p>}
    </Form>
  )
}

export default NewMemberForm
