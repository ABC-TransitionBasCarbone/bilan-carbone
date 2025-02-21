'use client'

import { resetPassword } from '@/services/serverFunctions/user'
import { EmailCommand, EmailCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl } from '@mui/material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'
import authStyles from './Auth.module.css'

const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL

const NewPasswordForm = () => {
  const t = useTranslations('login.form')
  const [errorMessage, setErrorMessage] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const searchParams = useSearchParams()

  const {
    control,
    getValues,
    formState: { isValid },
    setValue,
  } = useForm<EmailCommand>({
    resolver: zodResolver(EmailCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: searchParams.get('email') ?? '',
    },
  })

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    setErrorMessage('')

    if (!isValid) {
      setErrorMessage('emailRequired')
      setSubmitting(false)
    } else {
      await resetPassword(getValues().email)
      setSubmitting(false)
      setMessage('emailSent')
    }
  }

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setValue('email', email)
    }
  }, [searchParams])

  return (
    <Form onSubmit={onSubmit} className="grow justify-center">
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
        {errorMessage && (
          <p className="error">
            {t.rich(errorMessage, {
              link: (children) => <Link href={`mailto:${contactMail}`}>{children}</Link>,
            })}
          </p>
        )}
        {message && <p>{t(message)}</p>}
      </FormControl>
    </Form>
  )
}

export default NewPasswordForm
