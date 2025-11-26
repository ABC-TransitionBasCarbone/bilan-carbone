'use client'

import Form from '@/components/base/Form'
import { FormTextField } from '@/components/form/TextField'
import { useServerFunction } from '@/hooks/useServerFunction'
import { addMember } from '@/services/serverFunctions/user'
import { AddMemberCommand, AddMemberCommandValidation } from '@/services/serverFunctions/user.command'
import { getEnvironmentRoles } from '@/utils/user'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem } from '@mui/material'
import { Environment, Role } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import LoadingButton from '../base/LoadingButton'
import { FormSelect } from '../form/Select'

interface Props {
  environment: Environment
}
const NewMemberForm = ({ environment }: Props) => {
  const router = useRouter()
  const t = useTranslations('newMember')
  const tRole = useTranslations('role')
  const { callServerFunction } = useServerFunction()

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
    await callServerFunction(() => addMember(command), {
      onSuccess: () => {
        router.push('/equipe')
      },
      getSuccessMessage: () => t('addedMember'),
    })
  }

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <FormTextField
        data-testid="new-member-firstName"
        type="firstName"
        control={form.control}
        name="firstName"
        label={t('firstName')}
      />
      <FormTextField
        data-testid="new-member-lastName"
        type="lastName"
        control={form.control}
        name="lastName"
        label={t('lastName')}
      />
      <FormTextField
        data-testid="new-member-email"
        type="email"
        control={form.control}
        name="email"
        label={t('email')}
        trim
      />
      <FormSelect control={form.control} translation={t} name="role" label={t('role')} data-testid="new-member-role">
        {Object.keys(getEnvironmentRoles(environment))
          .filter((role) => role !== Role.SUPER_ADMIN)
          .map((key) => (
            <MenuItem key={key} value={key}>
              {tRole(key)}
            </MenuItem>
          ))}
      </FormSelect>
      <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="new-member-create-button">
        {t('create')}
      </LoadingButton>
    </Form>
  )
}

export default NewMemberForm
