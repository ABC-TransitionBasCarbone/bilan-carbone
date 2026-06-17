'use client'

import Form from '@abc-transitionbascarbone/components/src/base/Form'
import LoadingButton from '@abc-transitionbascarbone/components/src/base/LoadingButton'
import { FormSelect } from '@abc-transitionbascarbone/components/src/form/Select'
import { FormTextField } from '@abc-transitionbascarbone/components/src/form/TextField'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import { Role, RoleMip } from '@abc-transitionbascarbone/db-common/enums'
import {
  AddMemberCommand,
  AddMemberCommandValidation,
} from '@abc-transitionbascarbone/services/serverFunctions/user.command'
import { ApiResponse } from '@abc-transitionbascarbone/utils/serverResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

interface Props {
  environmentRoles: typeof Role | typeof RoleMip
  addMember: (command: AddMemberCommand) => Promise<ApiResponse<void>>
}
const NewMemberFormCommon = ({ environmentRoles, addMember }: Props) => {
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
        {Object.keys(environmentRoles)
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

export default NewMemberFormCommon
