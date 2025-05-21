'use client'

import { activateEmail } from '@/services/serverFunctions/user'
import { EmailCommand, EmailCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'
import authStyles from './Auth.module.css'

const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL
const faq = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''

const ActivationForm = () => {
  const t = useTranslations('activation')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setValue('email', email)
    }
  }, [searchParams])

  const { control, getValues, setValue, handleSubmit } = useForm<EmailCommand>({
    resolver: zodResolver(EmailCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: searchParams.get('email') ?? '',
    },
  })

  const onSubmit = async () => {
    setMessage('')
    setSubmitting(true)

    const activation = await activateEmail(getValues().email)
    setSubmitting(false)

    if (activation.success) {
      setSuccess(true)
      setMessage(activation.data)
    } else {
      setSuccess(false)
      setMessage(activation.errorMessage)
    }
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="grow justify-center">
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
        {message && (
          <p className={classNames(!success ? 'error' : '')} data-testid="activation-form-message">
            {t.rich(message, {
              support: (children) => <Link href={`mailto:${contactMail}`}>{children}</Link>,
              link: (children) => (
                <Link href={faq} target="_blank" rel="noreferrer noopener">
                  {children}
                </Link>
              ),
            })}
          </p>
        )}
      </FormControl>
    </Form>
  )
}

export default ActivationForm
