'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { FormTextField } from '@/components/form/TextField'
import Button from '@/components/base/Button'
import { useRouter } from 'next/navigation'
import Form from '@/components/base/Form'
import { MenuItem } from '@mui/material'
import { Role, StudyRole } from '@prisma/client'
import { StudyWithRights } from '@/db/study'
import { FormSelect } from '@/components/form/Select'
import { User } from 'next-auth'
import { NewStudyRightCommand, NewStudyRightCommandValidation } from '@/services/serverFunctions/study.command'
import { newStudyRight } from '@/services/serverFunctions/study'

interface Props {
  study: StudyWithRights
  user: User
}

const NewStudyRightForm = ({ study, user }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.rights.new')
  const tRole = useTranslations('study.role')

  const [error, setError] = useState('')

  const form = useForm<NewStudyRightCommand>({
    resolver: zodResolver(NewStudyRightCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      email: '',
    },
  })

  const onSubmit = async (command: NewStudyRightCommand) => {
    const result = await newStudyRight(command)
    if (result) {
      setError(result)
    } else {
      router.push(`/etudes/${study.id}/droits`)
      router.refresh()
    }
  }

  const userRoleOnStudy = useMemo(() => {
    return study.allowedUsers.find((right) => right.user.email === user.email)
  }, [user, study])

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <FormTextField
        data-testid="study-rights-email"
        type="email"
        control={form.control}
        translation={t}
        name="email"
        label={t('email')}
      />
      <FormSelect control={form.control} translation={t} name="role" label={t('role')} data-testid="study-rights-role">
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
  )
}

export default NewStudyRightForm
