'use client'

import { activateEmail } from '@/services/serverFunctions/user'
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

const ActivationForm = () => {
  const t = useTranslations('activation')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setValue('email', email)
    }
  }, [searchParams])

  const {
    control,
    getValues,
    setValue,
    formState: { isValid },
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
    activate()
  }

  const activate = async () => {
    setErrorMessage('')
    setSubmitting(true)

    if (isValid) {
      const result = await activateEmail(getValues().email)
      setSubmitting(false)
      if (result) {
        setErrorMessage(result)
      } else {
        setSuccess(true)
      }
    } else {
      setSubmitting(false)
      setErrorMessage('emailRequired')
    }
  }

  if (success) {
    return <p data-testid="activation-success">{t('success')}</p>
  }
  return (
    <Form onSubmit={onSubmit} className="grow justify-center">
      <FormControl className={authStyles.form}>
        <p>{t('description')}</p>
        <FormTextField
          control={control}
          translation={t}
          name="email"
          className={authStyles.input}
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          data-testid="activation-email"
        />
        <LoadingButton data-testid="activation-button" type="submit" loading={submitting} fullWidth>
          {t('validate')}
        </LoadingButton>
        {errorMessage && (
          <p className="error" data-testid="activation-form-error">
            {t.rich(errorMessage, {
              link: (children) => <Link href={`mailto:${contactMail}`}>{children}</Link>,
            })}
          </p>
        )}
      </FormControl>
    </Form>
  )
}

export default ActivationForm
