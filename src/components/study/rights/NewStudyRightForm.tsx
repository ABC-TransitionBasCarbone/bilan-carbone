'use client'

import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import styles from './NewStudyRightForm.module.css'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import { MenuItem } from '@mui/material'
import { Role, StudyRole } from '@prisma/client'
import { FullStudy } from '@/db/study'
import { FormSelect } from '@/components/form/Select'
import { NewStudyRightCommand, NewStudyRightCommandValidation } from '@/services/serverFunctions/study.command'
import { newStudyRight } from '@/services/serverFunctions/study'

interface Props {
  study: FullStudy
  user: User
  usersEmail: string[]
}

const NewStudyRightForm = ({ study, user, usersEmail }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.rights.new')
  const tRole = useTranslations('study.role')
  const [externalWarning, setExternalWarning] = useState(false)

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

  const checkExternal = (value: string | null) => {
    setExternalWarning(false)
    const validEmail = NewStudyRightCommandValidation.shape.email.safeParse(value)
    if (validEmail.success && value && !usersEmail.includes(value)) {
      setExternalWarning(true)
    }
  }

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
      <FormAutocomplete
        data-testid="study-rights-email"
        control={form.control}
        translation={t}
        options={usersEmail}
        name="email"
        label={t('email')}
        onChangedValue={checkExternal}
        freeSolo
      />
      {externalWarning && <p className={styles.warning}>{t('validation.external')}</p>}
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
