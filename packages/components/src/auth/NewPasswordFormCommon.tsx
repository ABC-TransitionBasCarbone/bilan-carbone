'use client'

import { EmailCommand, EmailCommandValidation } from '@abc-transitionbascarbone/components/src/auth/user.command'
import Form from '@abc-transitionbascarbone/components/src/base/Form'
import LoadingButton from '@abc-transitionbascarbone/components/src/base/LoadingButton'
import { FormTextField } from '@abc-transitionbascarbone/components/src/form/TextField'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import authStyles from './Auth.module.css'

interface Props {
  resetPassword: (email: string) => Promise<void>
}

const NewPasswordFormCommon = ({ resetPassword }: Props) => {
  const t = useTranslations('login.form')
  const [submitting, setSubmitting] = useState(false)
  const searchParams = useSearchParams()

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
    await resetPassword(getValues().email.toLowerCase())
    setSubmitting(false)
  }

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setValue('email', email)
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
          data-testid="input-email"
          trim
        />
        <LoadingButton type="submit" data-testid="reset-button" loading={submitting} fullWidth>
          {t('reset')}
        </LoadingButton>
      </FormControl>
    </Form>
  )
}

export default NewPasswordFormCommon
