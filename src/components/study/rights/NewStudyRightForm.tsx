'use client'

import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormSelect } from '@/components/form/Select'
import { getOrganizationUsers } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { getNewStudyRightStatus, newStudyRight } from '@/services/serverFunctions/study'
import { NewStudyRightCommand, NewStudyRightCommandValidation } from '@/services/serverFunctions/study.command'
import { NewStudyRightStatus } from '@/services/study'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem } from '@mui/material'
import { Role, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { SyntheticEvent, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import NewStudyRightDialog from './NewStudyRightDialog'

interface Props {
  study: FullStudy
  user: User
  users: Awaited<ReturnType<typeof getOrganizationUsers>>
}

const NewStudyRightForm = ({ study, user, users }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.rights.new')
  const tRole = useTranslations('study.role')

  const [error, setError] = useState('')
  const [status, setStatus] = useState<NewStudyRightStatus>()

  const form = useForm<NewStudyRightCommand>({
    resolver: zodResolver(NewStudyRightCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      email: '',
    },
  })

  const onEmailChange = (_: SyntheticEvent, value: string | null) => {
    form.setValue('email', value || '')
  }

  const saveRight = async (command: NewStudyRightCommand) => {
    const result = await newStudyRight(
      status === NewStudyRightStatus.ReaderOnly || status === NewStudyRightStatus.InternReader
        ? { ...command, role: StudyRole.Reader }
        : command,
    )

    setStatus(undefined)
    if (result) {
      setError(result)
    } else {
      router.push(`/etudes/${study.id}/cadrage`)
      router.refresh()
    }
  }

  const onSubmit = async (command: NewStudyRightCommand) => {
    const status = await getNewStudyRightStatus(command.email, command.role, study.level)
    if (status === NewStudyRightStatus.Valid) {
      await saveRight(command)
    } else if (
      status === NewStudyRightStatus.OtherOrganization ||
      status === NewStudyRightStatus.ReaderOnly ||
      status === NewStudyRightStatus.InternReader
    ) {
      setStatus(status)
    } else {
      setError(error)
    }
  }

  const userRoleOnStudy = useMemo(() => {
    return study.allowedUsers.find((right) => right.user.email === user.email)
  }, [user, study])

  const usersOptions = useMemo(
    () =>
      users.map((user) => ({
        label: `${user.firstName} ${user.lastName.toUpperCase()} - ${user.email}`,
        value: user.email,
      })),
    [users],
  )

  return (
    <>
      <Form onSubmit={form.handleSubmit(onSubmit)}>
        <FormAutocomplete
          data-testid="study-rights-email"
          control={form.control}
          translation={t}
          options={usersOptions}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
          filterOptions={(options, { inputValue }) =>
            options.filter((option) =>
              typeof option === 'string' ? option : option.label.toLowerCase().includes(inputValue.toLowerCase()),
            )
          }
          name="email"
          label={t('email')}
          onInputChange={onEmailChange}
          freeSolo
        />
        <FormSelect
          control={form.control}
          translation={t}
          name="role"
          label={t('role')}
          data-testid="study-rights-role"
        >
          {Object.keys(StudyRole)
            .filter(
              (role) =>
                user.role === Role.ADMIN ||
                (userRoleOnStudy && userRoleOnStudy.role === StudyRole.Validator) ||
                role !== StudyRole.Validator,
            )
            .map((key) => (
              <MenuItem key={key} value={key}>
                {tRole(key)}
              </MenuItem>
            ))}
        </FormSelect>
        <Button type="submit" disabled={form.formState.isSubmitting} data-testid="study-rights-create-button">
          {t('create')}
        </Button>
        {error && <p>{error}</p>}
      </Form>
      <NewStudyRightDialog
        status={status}
        decline={() => setStatus(undefined)}
        accept={() => saveRight(form.getValues())}
      />
    </>
  )
}

export default NewStudyRightForm
