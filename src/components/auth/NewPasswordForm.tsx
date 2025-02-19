'use client'

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

interface Props {
  reset: (email: string) => Promise<void>
}

const NewPasswordForm = ({ reset }: Props) => {
  const t = useTranslations('login.form')
  const [errorMessage, setErrorMessage] = useState('')
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
    if (!form.formState.isValid) {
      setErrorMessage('emailRequired')
      setSubmitting(false)
    } else {
      await reset(form.getValues().email)
      setSubmitting(false)
    }
  }

  const searchParams = useSearchParams()
  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      form.setValue('email', email)
    }
  }, [searchParams])

  return (
    <Form onSubmit={onSubmit} className={authStyles.small}>
      <FormControl className={authStyles.form}>
        <FormTextField
          control={form.control}
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

export default NewPasswordForm
