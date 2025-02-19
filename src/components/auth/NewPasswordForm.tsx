'use client'

import { EmailCommand, EmailCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'
import authStyles from './Auth.module.css'

interface Props {
  reset: (email: string) => Promise<void>
}

const NewPasswordForm = ({ reset }: Props) => {
  const t = useTranslations('login.form')
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<EmailCommand>({
    resolver: zodResolver(EmailCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    await reset(form.getValues().email)
    setSubmitting(false)
  }

  const searchParams = useSearchParams()
  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      form.setValue('email', email)
    }
  }, [searchParams])

  return (
    <Form onSubmit={onSubmit} className={classNames(authStyles.small)}>
      <FormControl className={classNames(authStyles.form)}>
        <FormTextField
          control={form.control}
          className={authStyles.input}
          required
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          name="email"
          translation={t}
          data-testid="input-email"
        />
        <LoadingButton type="submit" data-testid="reset-button" loading={submitting}>
          {t('reset')}
        </LoadingButton>
      </FormControl>
    </Form>
  )
}

export default NewPasswordForm
