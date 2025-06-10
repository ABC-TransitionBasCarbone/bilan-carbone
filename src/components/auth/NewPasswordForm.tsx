'use client'

import { useServerFunction } from '@/hooks/useServerFunction'
import { resetPassword } from '@/services/serverFunctions/user'
import { EmailCommand, EmailCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl } from '@mui/material'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'
import authStyles from './Auth.module.css'

const NewPasswordForm = () => {
  const t = useTranslations('login.form')
  const [submitting, setSubmitting] = useState(false)
  const [env, setEnv] = useState<Environment | undefined>()
  const searchParams = useSearchParams()
  const { callServerFunction } = useServerFunction()
  const router = useRouter()

  const { control, getValues, handleSubmit, setValue } = useForm<EmailCommand>({
    resolver: zodResolver(EmailCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: searchParams.get('email') ?? '',
    },
  })

  const onSubmit = async () => {
    setSubmitting(true)

    await callServerFunction(() => resetPassword(getValues().email.toLowerCase(), env), {
      getSuccessMessage: () => t('emailSent'),
      getErrorMessage: (error) => t(error),
      onSuccess: () => {
        router.push('/login')
      },
    })
    setSubmitting(false)
  }

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setValue('email', email)
    }
    const environment = searchParams.get('env')
    if (environment && Object.keys(Environment).includes(environment)) {
      setEnv(environment as Environment)
    }
  }, [searchParams, setValue])

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="grow justify-center">
      <FormControl className={authStyles.form}>
        <FormTextField
          control={control}
          className={authStyles.input}
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          name="email"
          translation={t}
          data-testid="input-email"
        />
        <LoadingButton type="submit" data-testid="reset-button" loading={submitting} fullWidth>
          {t('reset')}
        </LoadingButton>
      </FormControl>
    </Form>
  )
}

export default NewPasswordForm
