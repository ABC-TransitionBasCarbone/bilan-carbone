'use client'

import { TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import LoadingButton from '../base/LoadingButton'
import authStyles from './Auth.module.css'

interface Props {
  reset: (email: string) => Promise<void>
}

const NewPasswordForm = ({ reset }: Props) => {
  const t = useTranslations('login.form')
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState('')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    await reset(email)
    setSubmitting(false)
  }

  const searchParams = useSearchParams()
  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setEmail(email)
    }
  }, [searchParams])

  return (
    <form onSubmit={onSubmit} className={authStyles.form}>
      <TextField
        data-testid="input-email"
        className={authStyles.input}
        required
        label={t('email')}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <LoadingButton type="submit" data-testid="reset-button" disabled={submitting} loading={submitting}>
        {t('reset')}
      </LoadingButton>
    </form>
  )
}

export default NewPasswordForm
