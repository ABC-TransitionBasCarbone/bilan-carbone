'use client'

import { activateEmail } from '@/services/serverFunctions/user'
import { TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { FormEvent, useState } from 'react'
import LoadingButton from '../base/LoadingButton'
import authStyles from './Auth.module.css'

const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL

const ActivationForm = () => {
  const t = useTranslations('activation')
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await activateEmail(email)
    setSubmitting(false)
    if (result) {
      setError(result)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return <p data-testid="activation-success">{t('success')}</p>
  }

  return (
    <form onSubmit={onSubmit} className={authStyles.form}>
      <p>{t('description')}</p>
      <TextField
        className={authStyles.input}
        data-testid="activation-email"
        label={t('email')}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={success}
        required
      />
      <LoadingButton data-testid="activation-button" type="submit" disabled={success} loading={submitting}>
        {t('validate')}
      </LoadingButton>
      {error && (
        <p className="error" data-testid="activation-form-error">
          {t.rich(error, {
            link: (children) => <Link href={`mailto:${contactMail}`}>{children}</Link>,
          })}
        </p>
      )}
    </form>
  )
}

export default ActivationForm
